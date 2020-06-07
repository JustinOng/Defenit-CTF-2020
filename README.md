## Bad Tumblers

Working for *Bad Tumblers*, a challenge involving identifying information from cryptocurrency tumbler networks.

A bit more info and background can be found [here](https://blog.justins.in/defenit2020#bad-tumblers).

```python
import requests
from json import loads
import os
import pandas as pd
import numpy as np
import collections
```


```python
# Register for a free API key https://etherscan.io/myapikey
API_KEY = "REPLACEME"
SRC = "0x5149Aa7Ef0d343e785663a87cC16b7e38F7029b2".lower()
DST = "0x2Fd3F2701ad9654c1Dd15EE16C5dB29eBBc80Ddf".lower()

# time of first txn out of SRC
START_TIME = 1590927652 - 300
END_TIME = 1590933273

# transaction values are stored as ints (original value * 1e18)
MULTIPLIER = 1e18
```


```python
def get_txn(addr, ignore_cache=False):
    cache_file = f'cache/{addr}'
    
    if not ignore_cache and os.path.isfile(cache_file):
        with open(cache_file, "r") as f:
            return loads(f.read())["result"]
    
    r = requests.get(f'https://api-ropsten.etherscan.io/api?module=account&action=txlist&address={addr}&tag=latest&apikey={API_KEY}',
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36"
                    })
    data = loads(r.text)
    if data["message"] != "OK":
        print(data)
        raise Exception("Bad response")
    
    with open(cache_file, "w+") as f:
        f.write(r.text)
    
    return data["result"]
    
```

Extract all transactions made by the source and destination addresses


```python
src_txn = pd.DataFrame(get_txn(SRC))
dst_txn = pd.DataFrame(get_txn(DST))

src_txn["timeStamp"] = src_txn["timeStamp"].astype("int64")
dst_txn["timeStamp"] = dst_txn["timeStamp"].astype("int64")
```

Extract all addresses that the src address feeds into, and all addresses that feed into the dst address. These addresses are treated as "known tumbler" addresses


```python
tumbler_in_addr = src_txn[(src_txn["from"] == SRC) & (src_txn["timeStamp"] > START_TIME) & (src_txn["timeStamp"] < END_TIME)]["to"]
tumbler_out_addr = dst_txn[(dst_txn["to"] == DST) & (dst_txn["timeStamp"] > START_TIME) & (dst_txn["timeStamp"] < END_TIME)]["from"]
```


```python
tumbler_addr = list(set(tumbler_in_addr.tolist() + tumbler_out_addr.tolist()))

txn_acc = []
for addr in tumbler_addr:
    txn_acc += get_txn(addr)

txn = pd.DataFrame(txn_acc)
```


```python
txn
```




<div>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>blockNumber</th>
      <th>timeStamp</th>
      <th>hash</th>
      <th>nonce</th>
      <th>blockHash</th>
      <th>transactionIndex</th>
      <th>from</th>
      <th>to</th>
      <th>value</th>
      <th>gas</th>
      <th>gasPrice</th>
      <th>isError</th>
      <th>txreceipt_status</th>
      <th>input</th>
      <th>contractAddress</th>
      <th>cumulativeGasUsed</th>
      <th>gasUsed</th>
      <th>confirmations</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>7980980</td>
      <td>1590590977</td>
      <td>0xb2c0d083a0943290906b1476516c5b657845723a35ff...</td>
      <td>33110063</td>
      <td>0x460adfcb5fe3978be8e1958fa088c343b81486efda6d...</td>
      <td>60</td>
      <td>0x81b7e08f65bdf5648606c89998a9cc8164397647</td>
      <td>0xd8340e8907f2f10fad701cf632adb2504d3a8f51</td>
      <td>1000000000000000000</td>
      <td>21000</td>
      <td>16</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>7854918</td>
      <td>21000</td>
      <td>55641</td>
    </tr>
    <tr>
      <th>1</th>
      <td>7980980</td>
      <td>1590590977</td>
      <td>0x0c98280db4862a95f82e243871af35332cb41505f59a...</td>
      <td>33110064</td>
      <td>0x460adfcb5fe3978be8e1958fa088c343b81486efda6d...</td>
      <td>63</td>
      <td>0x81b7e08f65bdf5648606c89998a9cc8164397647</td>
      <td>0xd8340e8907f2f10fad701cf632adb2504d3a8f51</td>
      <td>1000000000000000000</td>
      <td>21000</td>
      <td>16</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>7917918</td>
      <td>21000</td>
      <td>55641</td>
    </tr>
    <tr>
      <th>2</th>
      <td>7980981</td>
      <td>1590591022</td>
      <td>0x1f955329e2e222ac061ca6b3866882773c83fa8f4af2...</td>
      <td>33110065</td>
      <td>0xba5e88bbd7e2744bdc4a5f54466e1510f497c636b2cc...</td>
      <td>30</td>
      <td>0x81b7e08f65bdf5648606c89998a9cc8164397647</td>
      <td>0xd8340e8907f2f10fad701cf632adb2504d3a8f51</td>
      <td>1000000000000000000</td>
      <td>21000</td>
      <td>16</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>7886819</td>
      <td>21000</td>
      <td>55640</td>
    </tr>
    <tr>
      <th>3</th>
      <td>7980981</td>
      <td>1590591022</td>
      <td>0x54a7d9d89ecd2770b9b8f17c6cf2158ec9177502c4af...</td>
      <td>33110067</td>
      <td>0xba5e88bbd7e2744bdc4a5f54466e1510f497c636b2cc...</td>
      <td>34</td>
      <td>0x81b7e08f65bdf5648606c89998a9cc8164397647</td>
      <td>0xd8340e8907f2f10fad701cf632adb2504d3a8f51</td>
      <td>1000000000000000000</td>
      <td>21000</td>
      <td>16</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>7977815</td>
      <td>21000</td>
      <td>55640</td>
    </tr>
    <tr>
      <th>4</th>
      <td>7980982</td>
      <td>1590591045</td>
      <td>0x395c3da9caf8e4894627514a6ec21f2037855a0ecceb...</td>
      <td>33110071</td>
      <td>0x8b1ff54cae23744629f7dd00c2c69832e07ba35481dd...</td>
      <td>30</td>
      <td>0x81b7e08f65bdf5648606c89998a9cc8164397647</td>
      <td>0xd8340e8907f2f10fad701cf632adb2504d3a8f51</td>
      <td>1000000000000000000</td>
      <td>21000</td>
      <td>16</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>7640289</td>
      <td>21000</td>
      <td>55639</td>
    </tr>
    <tr>
      <th>...</th>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
    </tr>
    <tr>
      <th>65123</th>
      <td>8029130</td>
      <td>1591270883</td>
      <td>0x755b9cb1c43bcf8a539b6ff6b0f08a105ce313e52926...</td>
      <td>106</td>
      <td>0x69ab73bf299ab69170c00c4e9eb227793fb5716c096e...</td>
      <td>21</td>
      <td>0x98c6fe0e5407643d8623be4e7db6c4799db58865</td>
      <td>0xed281881446e9140119dc617ed7e8e5e5a7ee182</td>
      <td>2700000000000000000</td>
      <td>100000</td>
      <td>1</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>4748450</td>
      <td>21000</td>
      <td>7488</td>
    </tr>
    <tr>
      <th>65124</th>
      <td>8029132</td>
      <td>1591270906</td>
      <td>0x30190dd679329d6be359148db46748b6155f80d097d4...</td>
      <td>100</td>
      <td>0xb66bde82c61cc4c11622dbd60ae837128d894743a680...</td>
      <td>51</td>
      <td>0xed281881446e9140119dc617ed7e8e5e5a7ee182</td>
      <td>0x61e4caea99dbd3d071ef38d5592dbecc3a284a37</td>
      <td>1900000000000000000</td>
      <td>100000</td>
      <td>1</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>6113825</td>
      <td>21000</td>
      <td>7486</td>
    </tr>
    <tr>
      <th>65125</th>
      <td>8029132</td>
      <td>1591270906</td>
      <td>0xf32d97d34fb0d01cc9d26c9dfe331315e37e012cc303...</td>
      <td>88</td>
      <td>0xb66bde82c61cc4c11622dbd60ae837128d894743a680...</td>
      <td>72</td>
      <td>0xe512b7d0b293d1eddd8c03d898fcedc7d5c639f5</td>
      <td>0xed281881446e9140119dc617ed7e8e5e5a7ee182</td>
      <td>8300000000000000000</td>
      <td>100000</td>
      <td>1</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>6554825</td>
      <td>21000</td>
      <td>7486</td>
    </tr>
    <tr>
      <th>65126</th>
      <td>8029142</td>
      <td>1591271024</td>
      <td>0xfdd4a7b157bd4502b7b0dbb224f534ad6fa3268821af...</td>
      <td>84</td>
      <td>0xe2bf5fcbcb804034394cb73c1e26c1f52c89c747cf60...</td>
      <td>96</td>
      <td>0x0150530ae45f8529d9493fb1ef4b8dc79482aac0</td>
      <td>0xed281881446e9140119dc617ed7e8e5e5a7ee182</td>
      <td>3100000000000000000</td>
      <td>100000</td>
      <td>1</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>6529401</td>
      <td>21000</td>
      <td>7476</td>
    </tr>
    <tr>
      <th>65127</th>
      <td>8029146</td>
      <td>1591271135</td>
      <td>0xa70049cf367ae700b9d976f8338c83ea3debf11d6f4d...</td>
      <td>85</td>
      <td>0xd2e14cf9a8a05145c946b06efa5cdc9ad02ff61bdfe0...</td>
      <td>135</td>
      <td>0xd922d6c1829f1ff3ec07d6bb46e5cb9426c1d4a1</td>
      <td>0xed281881446e9140119dc617ed7e8e5e5a7ee182</td>
      <td>500000000000000000</td>
      <td>100000</td>
      <td>1</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>7233480</td>
      <td>21000</td>
      <td>7472</td>
    </tr>
  </tbody>
</table>
<p>65128 rows × 18 columns</p>
</div>



Extract all transactions that target tumbler addresses and are NOT from a tumbler address


```python
tumbler_rx_txn = txn[txn["to"].isin(tumbler_addr) & (~txn["from"].isin(tumbler_addr))]
```

Compute how much each individual address has sent into the tumbler network


```python
d = collections.defaultdict(lambda: 0)

for i, t in tumbler_rx_txn.iterrows():
    d[t["from"]] += int(t["value"])
```


```python
inps = list(dict(d).items())
inps.sort(key=lambda x: x[1])
```


```python
inps[-20:]
```




    [('0xa8e0fd25440cf751f9b06b1df131c01fcebb716b', 161100000000000000000),
     ('0x6469e8c31bbfdd74d79760778b801fb3d81aed55', 161100000000000000000),
     ('0xd176fe27713aa3c269bae5635c39ad3092013b39', 162500000000000000000),
     ('0x72bff7e51a5b0effb6cbd92c034898b4363cb9c5', 162900000000000000000),
     ('0xfee255ec39c110bff6b7dbac97daf5977196369e', 163000000000000000000),
     ('0x5700df105fde72837c85341a85a28ac8b52ef175', 165200000000000000000),
     ('0xe62a99f65e602719db9ef029a64f00b5235651d9', 166900000000000000000),
     ('0x589f0bc0dc3639c69785d9fdf08b5b7395284370', 167400000000000000000),
     ('0xd2e20f324a612a0a7d1f14986fbd9d835bdd1331', 167900000000000000000),
     ('0x0b512200b606d69978248bd2f814620a883699f6', 171300000000000000000),
     ('0xe480a848af5c9dcd755dee9f0336355ed2f2016b', 172100000000000000000),
     ('0x8f0988a77961fa5aebc150ed647f1cf1ebc1b0ad', 174400000000000000000),
     ('0x1bcce97cf90fa566631dafbdd92cc0df91cd7a86', 178800000000000000000),
     ('0xf589f7405f0be5102e073ed92fab170ac8feaac9', 181400000000000000000),
     ('0x511bdda4f1b7c31d587894eb5c3e4e318f6ad470', 182400000000000000000),
     ('0x306b91815a339b0e8ad759470622087367cf7ebe', 195600000000000000000),
     ('0xcddd6955cd629610969389f6e30b347199b5f7c0', 205900000000000000000),
     ('0x4c5e179bbc6d393affb72018f9bba4b3cee6de65', 262070383048225781100),
     ('0x5149aa7ef0d343e785663a87cc16b7e38f7029b2', 435003015121322506400),
     ('0x81b7e08f65bdf5648606c89998a9cc8164397647', 1784000000000000000000)]



0x4c5e179bbc6d393affb72018f9bba4b3cee6de65 is the address that has sent the next largest amount of eth into the tumbler, works when submitted as the flag


```python
wallet_txn = pd.DataFrame(get_txn("0x4c5e179bbc6d393affb72018f9bba4b3cee6de65"))
wallet_txn["timeStamp"] = wallet_txn["timeStamp"].astype("int64")
wallet_txn
```




<div>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>blockNumber</th>
      <th>timeStamp</th>
      <th>hash</th>
      <th>nonce</th>
      <th>blockHash</th>
      <th>transactionIndex</th>
      <th>from</th>
      <th>to</th>
      <th>value</th>
      <th>gas</th>
      <th>gasPrice</th>
      <th>isError</th>
      <th>txreceipt_status</th>
      <th>input</th>
      <th>contractAddress</th>
      <th>cumulativeGasUsed</th>
      <th>gasUsed</th>
      <th>confirmations</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>8002003</td>
      <td>1590921689</td>
      <td>0x89a91bff7355e355bd9be9cd254b5195f5a7f6c2de75...</td>
      <td>0</td>
      <td>0x5bc94bdffc5491a58175a5077a92b0b85ebc9911abe5...</td>
      <td>3</td>
      <td>0x5dbc9da0317c550460d501742294ac9d07d7054a</td>
      <td>0x4c5e179bbc6d393affb72018f9bba4b3cee6de65</td>
      <td>4999900000000000000</td>
      <td>100000</td>
      <td>1000000000</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>195226</td>
      <td>21000</td>
      <td>44665</td>
    </tr>
    <tr>
      <th>1</th>
      <td>8002004</td>
      <td>1590921692</td>
      <td>0xc9e80a9be0e5e4e279ad3af72eec2704cc18bf112cfc...</td>
      <td>0</td>
      <td>0x89a8c29e7d1a0f9a85e60c0b98f875313ad0466361fc...</td>
      <td>2</td>
      <td>0xa8325fb2c1c15da2396ad77580c136d13578dd30</td>
      <td>0x4c5e179bbc6d393affb72018f9bba4b3cee6de65</td>
      <td>4999900000000000000</td>
      <td>100000</td>
      <td>1000000000</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>69006</td>
      <td>21000</td>
      <td>44664</td>
    </tr>
    <tr>
      <th>2</th>
      <td>8002004</td>
      <td>1590921692</td>
      <td>0x17cf97273309f45d04e227ca7d8ad2fe62186c7f3149...</td>
      <td>0</td>
      <td>0x89a8c29e7d1a0f9a85e60c0b98f875313ad0466361fc...</td>
      <td>3</td>
      <td>0x8c9e8951f64900585572e8eb8c4dc8c0bb38dce5</td>
      <td>0x4c5e179bbc6d393affb72018f9bba4b3cee6de65</td>
      <td>4999900000000000000</td>
      <td>100000</td>
      <td>1000000000</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>90006</td>
      <td>21000</td>
      <td>44664</td>
    </tr>
    <tr>
      <th>3</th>
      <td>8002004</td>
      <td>1590921692</td>
      <td>0x38e2c671d63932594adf437bb1e09ce9b7371259123a...</td>
      <td>0</td>
      <td>0x89a8c29e7d1a0f9a85e60c0b98f875313ad0466361fc...</td>
      <td>4</td>
      <td>0xd3c7f4cf33ed62e5d52eb7e6e9d9161ae1a164a2</td>
      <td>0x4c5e179bbc6d393affb72018f9bba4b3cee6de65</td>
      <td>4999900000000000000</td>
      <td>100000</td>
      <td>1000000000</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>111006</td>
      <td>21000</td>
      <td>44664</td>
    </tr>
    <tr>
      <th>4</th>
      <td>8002005</td>
      <td>1590921695</td>
      <td>0x1a1451ac85dbd990f98bf7ca2c7939107285240be2fc...</td>
      <td>0</td>
      <td>0x07649f39eba3d3749f5d47e6f8b191d5ad775020e6fb...</td>
      <td>0</td>
      <td>0x2458b57bfc409e3660dedc7d0ee954289572b1d2</td>
      <td>0x4c5e179bbc6d393affb72018f9bba4b3cee6de65</td>
      <td>4999900000000000000</td>
      <td>100000</td>
      <td>1000000000</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>21000</td>
      <td>21000</td>
      <td>44663</td>
    </tr>
    <tr>
      <th>...</th>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
    </tr>
    <tr>
      <th>364</th>
      <td>8029108</td>
      <td>1591270656</td>
      <td>0xc7d469535b76ff7b400f75dcefc01970da8f39ae3895...</td>
      <td>229</td>
      <td>0x8776d6302a9864b67a31daba3b69a3b11f271a8fa83d...</td>
      <td>69</td>
      <td>0x4c5e179bbc6d393affb72018f9bba4b3cee6de65</td>
      <td>0xe1399b5256fafc2b48c2d0e6d7f39007bc9be8a4</td>
      <td>5400000000000000000</td>
      <td>100000</td>
      <td>1</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>5925987</td>
      <td>21000</td>
      <td>17560</td>
    </tr>
    <tr>
      <th>365</th>
      <td>8029118</td>
      <td>1591270763</td>
      <td>0x9618a0fa91a9ba5cf527b329e8020695db9a751b4a66...</td>
      <td>92</td>
      <td>0x322a618836aa463da1fb2f61aadbc196f59db994827a...</td>
      <td>122</td>
      <td>0x2b3bf8b02dd2476eefa18aa63da65bd8c03a0147</td>
      <td>0x4c5e179bbc6d393affb72018f9bba4b3cee6de65</td>
      <td>5400000000000000000</td>
      <td>100000</td>
      <td>1</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>7143251</td>
      <td>21000</td>
      <td>17550</td>
    </tr>
    <tr>
      <th>366</th>
      <td>8029142</td>
      <td>1591271024</td>
      <td>0x45a82330a7772997ffe2f459a9d70f1a514abe5d54fb...</td>
      <td>99</td>
      <td>0xe2bf5fcbcb804034394cb73c1e26c1f52c89c747cf60...</td>
      <td>159</td>
      <td>0x97fc2f5d7b4e05bc544f5f4053fd2e72af6c3c5e</td>
      <td>0x4c5e179bbc6d393affb72018f9bba4b3cee6de65</td>
      <td>900000000000000000</td>
      <td>100000</td>
      <td>1</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>7879019</td>
      <td>21000</td>
      <td>17526</td>
    </tr>
    <tr>
      <th>367</th>
      <td>8029145</td>
      <td>1591271120</td>
      <td>0x1c2364b5aa9e9bb9a569572e1a677241382232f3bb9c...</td>
      <td>230</td>
      <td>0x034c7b031bbb5a8d372a88a297f669804be1bcdcfbf2...</td>
      <td>124</td>
      <td>0x4c5e179bbc6d393affb72018f9bba4b3cee6de65</td>
      <td>0x2a621252a0ee1c8655b09eea7905d87be28fe9e3</td>
      <td>6800000000000000000</td>
      <td>100000</td>
      <td>1</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>7318324</td>
      <td>21000</td>
      <td>17523</td>
    </tr>
    <tr>
      <th>368</th>
      <td>8029145</td>
      <td>1591271120</td>
      <td>0xcd4eb916132ab1bb2432084bc3d2de24d0de9aa3e219...</td>
      <td>113</td>
      <td>0x034c7b031bbb5a8d372a88a297f669804be1bcdcfbf2...</td>
      <td>134</td>
      <td>0x1fc64526d77d079f7c8f6680d0b88b6046663949</td>
      <td>0x4c5e179bbc6d393affb72018f9bba4b3cee6de65</td>
      <td>2000000000000000000</td>
      <td>100000</td>
      <td>1</td>
      <td>0</td>
      <td>1</td>
      <td>0x</td>
      <td></td>
      <td>7740503</td>
      <td>21000</td>
      <td>17523</td>
    </tr>
  </tbody>
</table>
<p>369 rows × 18 columns</p>
</div>




```python
out_vals = wallet_txn[(wallet_txn["from"] == "0x4c5e179bbc6d393affb72018f9bba4b3cee6de65") & (wallet_txn["timeStamp"] > START_TIME) & (wallet_txn["timeStamp"] < END_TIME)]["value"]
total_out = sum(map(int, out_vals))
total_out / MULTIPLIER
```




    461.9032581447249



We know that the attacker:
* Put 435 eth from Wallet A into the tumbler network
* Took out 881 eth from Wallet C from the tumbler network

The difference, 881 - 435 = 446 matches the amount put in by `0x4c5e179bbc6d393affb72018f9bba4b3cee6de65` (assuming the difference is from fees)
