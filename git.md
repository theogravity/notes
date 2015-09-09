## Migrating a git repo into a new repo

### Source

```bash
git filter-branch -f --prune-empty --subdirectory-filter <directory of contents> master
git remote remove origin
git remote add origin <new repo url> 
git push --set-upstream origin master
```

## Migrating a git repo into a subdirectory of another git repo while keeping history

Note to see a file's history, you have to use `git log --follow <file>`:

Addl info:
http://stackoverflow.com/questions/2314652/is-it-possible-to-move-rename-files-in-git-and-maintain-their-history

### Source

(Do in the source git root)

```bash
git filter-branch -f --prune-empty --subdirectory-filter <directory of contents> master
```

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
git commit -m "Move src files to target dir"
# If on a branch
git checkout master
git merge <branch name>
# End if
git push

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
# If on a branch
git checkout master
git merge <branch name>
# End if
git push
```

### Reset Source

If you need to re-use the source again for another transfer, or just pure reset, do:

`git reset --hard refs/original/refs/heads/master`
