# Ignorant Deposit

An ERC20 deposit strategy requiring only 1 transaction from the user.

## Strategy

The ignorant deposit protocol uses the CREATE2 opcode to give each user a unique deposit address for all tokens. This address is called the ignorant deposit address.

A user transfers a token to their ignorant deposit address for the target contract.

At some point in the future the target contract may claim the tokens from an ignorant deposit address by performing a CREATE2 operation that creates a contract at the ignorant address. This contract can only transfer tokens from the ignorant contract to the target contract. The ignorant contract can be created and self destructed in the same transaction to reclaim gas. A system expecting many deposits may leave the contract in place, lazily creating ignorant deposit contracts for users.

## Gas cost

The conventional strategy of using `transferFrom` costs about 59k gas (105k gas including the user `approve` transaction). Claiming funds from an ignorant address costs about 173k gas, or 2.9x more (only 1.6x more including `approve` tx).

**However** claims from an ignorant contract can be batched (e.g. wait for 5 deposits then claim). The ignorant contract can also be treated as the account for a user depending on asset movement needs (instead of using a mapping or similar).

If the ignorant contract is not self-destructed subsequent deposits are **much** cheaper. The default flow is `approve` -> `transferFrom` (costing ~105k gas). The flow with an existing ignorant contract would be `transfer` -> `transfer` (costing ~102k gas and still requiring only 1 user transaction).

[Goerli test run](https://goerli.etherscan.io/address/0x3557a48008740596d1f03Cb1b286Cecf03a00BFd)

```sh
·----------------------------------|---------------------------|---------------|-----------------------------·
|       Solc version: 0.8.4        ·  Optimizer enabled: true  ·  Runs: 99999  ·  Block limit: 30000000 gas  │
···································|···························|···············|······························
|  Methods                                                                                                   │
··············|····················|·············|·············|···············|···············|··············
|  Contract   ·  Method            ·  Min        ·  Max        ·  Avg          ·  # calls      ·  eur (avg)  │
··············|····················|·············|·············|···············|···············|··············
|  Depositor  ·  claimByIgnorance  ·          -  ·          -  ·       172735  ·            2  ·          -  │
··············|····················|·············|·············|···············|···············|··············
|  Depositor  ·  claimByTransfer   ·          -  ·          -  ·        58826  ·            2  ·          -  │
··············|····················|·············|·············|···············|···············|··············
|  TestToken  ·  approve           ·          -  ·          -  ·        46105  ·            2  ·          -  │
··············|····················|·············|·············|···············|···············|··············
|  TestToken  ·  mint              ·          -  ·          -  ·        50849  ·            4  ·          -  │
··············|····················|·············|·············|···············|···············|··············
|  TestToken  ·  transfer          ·          -  ·          -  ·        51486  ·            2  ·          -  │
··············|····················|·············|·············|···············|···············|··············
|  Deployments                     ·                                           ·  % of limit   ·             │
···································|·············|·············|···············|···············|··············
|  Depositor                       ·          -  ·          -  ·       608713  ·          2 %  ·          -  │
···································|·············|·············|···············|···············|··············
|  TestToken                       ·          -  ·          -  ·       618656  ·        2.1 %  ·          -  │
·----------------------------------|-------------|-------------|---------------|---------------|-------------·
```
