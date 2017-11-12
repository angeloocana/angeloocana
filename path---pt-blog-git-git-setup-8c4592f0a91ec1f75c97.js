webpackJsonp([0xfe23c45c734],{"./node_modules/json-loader/index.js!./.cache/json/pt-blog-git-git-setup.json":function(e,a){e.exports={data:{markdownRemark:{fileAbsolutePath:"/home/angeloocana/dev/angeloocana/src/pages/blog/git/git-setup.pt.md",html:'<p>Habilite auto complete, Commit com titulo e descrição, navege pelo histórico, atualize fork e muito mais!</p>\n<h2>Habilitar auto complete ao digitar commandos git no terminal</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">wget</span> https://github.com/git/git/blob/master/contrib/completion/git-completion.bash --quiet --show-progress -O ~/git-completion.bash\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token keyword">echo</span> -e <span class="token string">"\\nsource ~/git-completion.bash"</span> <span class="token operator">>></span> ~/.bash_profile\n</code></pre>\n      </div>\n<h2>Criar commit com titulo e descrição completa</h2>\n<p><strong>Opcional</strong> Habilitar vim como editor padrão:\nEu amo o VIM, mas sei que é bem dificil para iniciantes.\nSe você quer subir para outro nivel como programador, aconselho aprender o editor mais poderoso que conheço.</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">export</span> EDITOR<span class="token operator">=</span><span class="token string">\'vim\'</span>\n</code></pre>\n      </div>\n<p>Abrir editor para preencher titulo e descrição do commit:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> commit -a\n</code></pre>\n      </div>\n<p>Primeira linha é o titulo\nTerceira linha em diante é a descrição.</p>\n<h2>Git Alias</h2>\n<p>to use ‘git st’</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> config --global alias.st status\n</code></pre>\n      </div>\n<p>All alias</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">cat</span> .git/config <span class="token operator">|</span> <span class="token function">grep</span> -A 1 <span class="token string">"\\[alias\\]"</span>\n</code></pre>\n      </div>\n<h2>Log</h2>\n<p><a href="https://git-scm.com/docs/pretty-formats">https://git-scm.com/docs/pretty-formats</a></p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> log --pretty<span class="token operator">=</span><span class="token string">\'%Cred%h%Creset | %C(yellow)%d%Creset %s %Cgreen(%cr)%Creset %C(cyan)[%an]%Creset\'</span> --graph --all\n</code></pre>\n      </div>\n<p>Alias log</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> config --global alias.lg <span class="token string">"log --pretty=\'%Cred%h%Creset | %C(yellow)%d%Creset %s %Cgreen(%cr)%Creset %C(cyan)[%an]%Creset\' --graph --all"</span>\n</code></pre>\n      </div>\n<h2>Diff</h2>\n<p>Words</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> config --global alias.dp <span class="token string">\'diff --word-diff --unified=10\'</span>\n</code></pre>\n      </div>\n<p>Blocks</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> <span class="token function">diff</span> --patience\n</code></pre>\n      </div>\n<p>histogram</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> <span class="token function">diff</span> histogram\n</code></pre>\n      </div>\n<h2>Verifying commits</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> config --global core.whitespace <span class="token string">"blank-at-eol,blank-at-eof,tab-in-indent"</span>\n</code></pre>\n      </div>\n<h2>Documenting Commits</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">wget</span> http://git.io/validate-commit-msg --show-progress --quiet -O .git/hooks/commit-msg\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">chmod</span> a+x .git/hooks/commit-msg\n</code></pre>\n      </div>\n<h2>Edit commit not pushed</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> commit --amend\n</code></pre>\n      </div>',excerpt:"Habilite auto complete, Commit com titulo e descrição, navege pelo histórico, atualize fork e muito mais! Habilitar auto complete ao digitar...",fields:{tagSlugs:[{tag:"Git",link:"/pt/tags/git/"},{tag:"controle de versões",link:"/pt/tags/controle-de-versoes/"}],slug:"/pt/blog/git/git-setup/",readNextPosts:[{excerpt:"Esse erro acontece quando você esta assistindo muitos arquivos no linux. Você pode receber uma mensagem erro como essa: error UNHANDLED...",frontmatter:{title:"Corrigir erro ENOSPC",date:"2017-09-03"},fields:{slug:"/pt/blog/linux/arch/fix-enospc-error/",langKey:"pt"}},{excerpt:"Instalar ZSH https://github.com/robbyrussell/oh-my-zsh/wiki/Installing-ZSH Instalar oh-my-zsh Baixar Instalar Transformar zsh em terminal...",frontmatter:{title:"Instalar ZSH e oh-my-zsh",date:"2017-06-23"},fields:{slug:"/pt/blog/terminal/install-zsh/",langKey:"pt"}},{excerpt:"Vim é um editor de texto da velha guarda, ele é executado no console, é o mais rápido de todos.\nÉ a melhor opção para acessar servidores...",frontmatter:{title:"Vim ajuda com comandos",date:"2017-08-08"},fields:{slug:"/pt/blog/vim/vim-help-commands/",langKey:"pt"}}]},frontmatter:{youtubeId:null,title:"Git comandos Avançados",tags:["Git","controle de versões"],date:"2017-06-23",structuredData:{alternativeHeadline:"...",type:"TechArticle",dependencies:"A computer",proficiencyLevel:"Beginner",articleSection:"Git",pageEnd:"...",pageStart:"...",pagination:"...",about:{name:"Git",alternateName:"Github",description:"Git is a free and open source distributed version control system designed to handle everything from small to very large projects with speed and efficiency.",identifier:"git",image:"...",sameAs:"https://git-scm.com/"},accessMode:"textual",accessModeSufficient:"textual",accessibilityAPI:"ARIA",accessibilityControl:"fullKeyboardControl, fullTouchControl, fullMouseControl",accessibilitySummary:"...",aggregateRating:"...",audience:"...",author:"angeloocana",comment:"...",commentCount:"...",contentLocation:"...",dateCreated:"...",dateModified:"...",datePublished:"...",discussionUrl:"...",educationalUse:"...",isAccessibleForFree:!0,isFamilyFriendly:!0,keywords:"...",locationCreated:"Ottawa CA",thumbnailUrl:"...",version:1,video:"..."}}}},pathContext:{path:"/pt/blog/git/git-setup/",langKey:"pt"}}}});
//# sourceMappingURL=path---pt-blog-git-git-setup-8c4592f0a91ec1f75c97.js.map