const fs = require("fs");
const esprima = require("esprima");
const escodegen = require("escodegen");

const g = escodegen.generate;

CHUNK_REGEX = /app\.(\w+)\(\"\/(\w{64})\", \(req, res\) => {\r?\n(.+?})\r?\n}\);/gs;

const data = fs.readFileSync("app.js", "utf-8");

const pp = (nodes) => console.log(JSON.stringify(nodes, null, 4));

function is_tainted(node, mainAst) {
  // check whether the given node references req
  function parseNode(node) {
    if (node.type === "Identifier") {
      if (node.name === "req") {
        return true;
      }

      return isIdentifierTainted(node.name, mainAst);
      return;
    } else if (node.type === "CallExpression") {
      for (const arg of node.arguments) {
        if (is_tainted(arg, mainAst)) {
          return true;
        }
      }
      return false;
    } else if (node.type === "TemplateLiteral") {
      for (const arg of node.expressions) {
        if (is_tainted(arg, mainAst)) {
          return true;
        }
      }
      return false;
    } else if (node.type === "ExpressionStatement") {
      return parseNode(node.expression);
    } else if (node.type === "AssignmentExpression") {
      if (parseNode(node.right)) {
        return true;
      }

      return false;
    } else if (node.type === "BinaryExpression") {
      return parseNode(node.left) || parseNode(node.right);
    } else if (node.type === "MemberExpression") {
      if (parseNode(node.object)) {
        // if this is something like req.ip["abcdef"] return false
        // all results in undefined
        if (
          node.object.type === "MemberExpression" &&
          node.object.object.type === "Identifier" &&
          node.object.object.name === "req" &&
          node.object.property.type === "Identifier" &&
          ["ip", "secure", "ips", "fresh", "route"].includes(node.object.property.name)
        ) {
          /*
            https://expressjs.com/en/api.html
          */
          if (
            node.property.type === "Literal" ||
            node.property.type === "Identifier"
          ) {
            return false;
          }
        }
        return true;
      }

      return false;
    } else if (node.type === "Literal") {
      return false;
    } else if (node.type === "UnaryExpression") {
      return parseNode(node.argument);
    } else if (node.type === "ArrayExpression") {
      for (const n of node.elements) {
        if (parseNode(n)) return true;
      }

      return false;
    } else if (node.type === "ObjectExpression") {
      for (const n of node.properties) {
        if (parseNode(n.value)) return true;
      }

      return false;
    } else if (node.type === "ThisExpression") {
      return false;
    } else if (node.type === "VariableDeclaration") {
      for (const n of node.declarations) {
        if (parseNode(n)) return true;
      }

      return false
    } else if (node.type === "VariableDeclarator") {
      return parseNode(node.init);
    } else {
      pp(node);
      throw Error(node.type);
    }
  }

  if (parseNode(node)) {
    console.log(g(node));
    return true;
  }

  return false;
}

function isIdentifierTainted(identifier, mainAst) {
  // check whether the given identifier (variable) references req
  // console.log(`isIdentifierTainted ${identifier} ${mainAst.length}`)
  for (const node of mainAst) {
    if (node.type === "ExpressionStatement") {
      const assignOp = node.expression
      if (assignOp.type === "AssignmentExpression" && assignOp.operator === "=") {
        if (assignOp.left.type === "Identifier" && assignOp.left.name === identifier) {
          // copy this and remove the current node so that we dont go recursive
          const newAst = mainAst.slice();
          newAst.splice(newAst.indexOf(node), 1);

          // handle identifier assigning
          if (assignOp.right.type === "Identifier") {
            return isIdentifierTainted(assignOp.right.name, newAst);
          }

          if (is_tainted(assignOp.right, newAst)) return true;
        }
      }
    }
  }

  return false
}

function findCalls(nodes) {
  // check through all nodes (and children) to identify and extract function calls
  const found = [];

  function parseNode(node) {
    if (node.type === "CallExpression") {
      found.push(node);
      return;
    } else if (node.type === "ExpressionStatement") {
      return parseNode(node.expression);
    } else if (node.type === "AssignmentExpression") {
      return parseNode(node.right);
    } else if (node.type === "BinaryExpression") {
      parseNode(node.left);
      parseNode(node.right);
      return;
    } else if (node.type === "MemberExpression") {
      return;
    } else if (node.type === "Literal") {
      return;
    } else if (node.type === "UnaryExpression") {
      return parseNode(node.argument);
    } else if (node.type === "ArrayExpression") {
      for (const n of node.elements) {
        parseNode(n);
      }
    } else if (node.type === "ObjectExpression") {
      for (const n of node.properties) {
        parseNode(n.value)
      }
    } else if (node.type === "Identifier") {
      return;
    } else if (node.type === "ThisExpression") {
      return;
    } else if (node.type === "VariableDeclaration") {
      for (const n of node.declarations) {
        parseNode(n);
      }
    } else if (node.type === "VariableDeclarator") {
      parseNode(node.init);
    } else {
      pp(node);
      throw Error(node.type);
    }
  }

  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      parseNode(node);
    }
  }

  return found;
}

const funcs = new Set();
for (let match of data.matchAll(CHUNK_REGEX)) {
  // https://github.com/jquery/esprima/issues/1953
  const code = match[0].replace("} catch {", "} catch(unused) {");
  const endpoint = match[2];
  const ast = esprima.parseScript(code, { tolerant: true });

  const mainAst = ast.body[0].expression.arguments[1].body.body[0].block.body;
  // console.log(JSON.stringify(main_ast, null, 4));
  const funcNodes = findCalls(mainAst);

  for (const node of funcNodes) {
    // dont care about assert calls being tainted (unless they're referenced by some other call, handled later)
    if (node.callee.type === "Identifier" && node.callee.name === "assert") {
      continue;
    }

    if (is_tainted(node, mainAst)) {
      console.log(`tainted ${endpoint}: ${g(node)}`);
      console.log();
    }
  }
}
