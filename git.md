## Migrating a git repo into a subdirectory of another git repo while keeping history

### Source

(Do in the source git root)

`git filter-branch -f --prune-empty --subdirectory-filter <directory of contents> master`

### Destination

(Do in destination git root)

#### Simple merge (your root does not have a bunch of files / dirs)

```bash
# If you want to do this in a branch
git checkout -b <branch name>
# http://stackoverflow.com/questions/4612157/how-to-use-mv-command-to-move-files-except-those-in-a-specific-directory
shopt -s extglob
git remote add -f <custom branch name> <path to Source root>
git merge <custom branch name>/master
mkdir <dest directory>
git mv !(<dir/file to exclude>|<dir/file to exclude 2>) <dest directory>
git commit
```

#### Complex merge (root contains a bunch of stuff that also might conflict like a package.json)

```bash
# If you want to do this in a branch
git checkout -b <branch name>
# http://stackoverflow.com/questions/4612157/how-to-use-mv-command-to-move-files-except-those-in-a-specific-directory
shopt -s extglob
git remote add -f <custom branch name> <path to Source root>
mkdir tmp
git mv !(tmp) tmp
git commit -m "Temp move of root"
git merge <custom branch name>/master
mkdir <dest directory>
git mv !(<dir/file to exclude>|<dir/file to exclude 2>) <dest directory>
git commit -m "Move src files to target dir"
cd tmp
git mv * ..
git commit -m "Move tmp files back to root"
```

### Reset Source

If you need to re-use the source again for another transfer, or just pure reset, do:

`git reset --hard refs/original/refs/heads/master`
