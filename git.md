## Migrating a git repo into a subdirectory of another git repo while keeping history

### Source

(Do in the source git root)

`git filter-branch -f --prune-empty --subdirectory-filter <directory of contents> master`

### Destination

(Do in destination git root)

```bash
# http://stackoverflow.com/questions/4612157/how-to-use-mv-command-to-move-files-except-those-in-a-specific-directory
shopt -s extglob
git remote add -f <custom branch name> <path to Source root>
git merge <custom branch name>/master
mkdir <dest directory>
git mv !(<dir to exclude>|<dir to exclude 2>) <dest directory>
git commit
```

### Reset Source

If you need to re-use the source again for another transfer, or just pure reset, do:

`git reset --hard refs/original/refs/heads/master`
