# Setup Git


## Install ZSH
https://github.com/robbyrussell/oh-my-zsh/wiki/Installing-ZSH

## oh-my-zsh
Download
```
    wget https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh --quiet --show-progress -O ~/install.sh
```

Install
```
    sh ~/install.sh
```

Make it your default shell: (You must logout to see the changes)
```
    sudo chsh -s $(which zsh)
```


## Auto Completion

```
    wget https://github.com/git/git/blob/master/contrib/completion/git-completion.bash --quiet --show-progress -O ~/git-completion.bash
```

```
    echo -e "\nsource ~/git-completion.bash" >> ~/.bash_profile
```

## Commit with title and full description
Set vim as default editor:
```
    export EDITOR='vim'
```

Open vim to edit commit message:
```
    git commit -a
```
first line is the title
third line is the full description


## Git Alias
to use 'git st'
```
    git config --global alias.st status
```

All alias
```
    cat .git/config | grep -A 1 "\[alias\]"
```

## Log
https://git-scm.com/docs/pretty-formats
```
    git log --pretty='%Cred%h%Creset | %C(yellow)%d%Creset %s %Cgreen(%cr)%Creset %C(cyan)[%an]%Creset' --graph --all
```
Alias log
```
    git config --global alias.lg "log --pretty='%Cred%h%Creset | %C(yellow)%d%Creset %s %Cgreen(%cr)%Creset %C(cyan)[%an]%Creset' --graph --all"
```

## Diff
Words
```
    git config --global alias.dp 'diff --word-diff --unified=10'
```

Blocks
```
    git diff --patience
```

histogram
```
    git diff histogram
```

## Verifying commits

```
    git config --global core.whitespace "blank-at-eol,blank-at-eof,tab-in-indent"
```

## Documenting Commits
```
    wget http://git.io/validate-commit-msg --show-progress --quiet -O .git/hooks/commit-msg
```
```
    chmod a+x .git/hooks/commit-msg
```

## Edit commit not pushed
```
    git commit --amend
```