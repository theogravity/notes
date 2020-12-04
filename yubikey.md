## Using gpg key for ssh
https://gist.github.com/jacquesbh/79d3bbf6cdde41800491f55f13c1d8f0

## Adding a subkey

https://github.com/drduh/YubiKey-Guide

https://wiki.debian.org/Subkeys

## Exporting key for ssh

- Install `openpgp2ssh` by doing `brew install monkeysphere`
- If password protected, remove the password on the key temporarily
  * `gpg2 --edit-key <key id>`
  * `passwd` -> set empty key, confirm
  * `quit`
- `gpg --export-secret-key <key id> | openpgp2ssh <key id> > ~/.ssh/id_rsa`
- `gpg --export <key id> | openpgp2ssh <key id> > ~/.ssh/id_rsa.pub`
- Re-encrypt gpg private key by following 2nd step again
