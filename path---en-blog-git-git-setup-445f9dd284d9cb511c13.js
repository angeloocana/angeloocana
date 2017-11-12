webpackJsonp([0x7b0a88e387eb],{"./node_modules/json-loader/index.js!./.cache/json/en-blog-git-git-setup.json":function(e,s){e.exports={data:{markdownRemark:{fileAbsolutePath:"/home/angeloocana/dev/angeloocana/src/pages/blog/git/git-setup.en.md",html:'<p>Enable Auto Complete, Commit with title and description, create alias, navigate history, update fork and more!</p>\n<h2>Enable Auto Complete while typing git commands on terminal</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">wget</span> https://github.com/git/git/blob/master/contrib/completion/git-completion.bash --quiet --show-progress -O ~/git-completion.bash\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token keyword">echo</span> -e <span class="token string">"\\nsource ~/git-completion.bash"</span> <span class="token operator">>></span> ~/.bash_profile\n</code></pre>\n      </div>\n<h2>Commit with title and full description</h2>\n<p>Set vim as default editor:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">export</span> EDITOR<span class="token operator">=</span><span class="token string">\'vim\'</span>\n</code></pre>\n      </div>\n<p>Open vim to edit commit message:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> commit -a\n</code></pre>\n      </div>\n<p>first line is the title\nthird line is the full description</p>\n<h2>Git Alias</h2>\n<p>to use ‘git st’</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> config --global alias.st status\n</code></pre>\n      </div>\n<p>All alias</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">cat</span> .git/config <span class="token operator">|</span> <span class="token function">grep</span> -A 1 <span class="token string">"\\[alias\\]"</span>\n</code></pre>\n      </div>\n<h2>Log</h2>\n<p><a href="https://git-scm.com/docs/pretty-formats">https://git-scm.com/docs/pretty-formats</a></p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> log --pretty<span class="token operator">=</span><span class="token string">\'%Cred%h%Creset | %C(yellow)%d%Creset %s %Cgreen(%cr)%Creset %C(cyan)[%an]%Creset\'</span> --graph --all\n</code></pre>\n      </div>\n<p>Alias log</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> config --global alias.lg <span class="token string">"log --pretty=\'%Cred%h%Creset | %C(yellow)%d%Creset %s %Cgreen(%cr)%Creset %C(cyan)[%an]%Creset\' --graph --all"</span>\n</code></pre>\n      </div>\n<h2>Diff</h2>\n<p>Words</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> config --global alias.dp <span class="token string">\'diff --word-diff --unified=10\'</span>\n</code></pre>\n      </div>\n<p>Blocks</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> <span class="token function">diff</span> --patience\n</code></pre>\n      </div>\n<p>histogram</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> <span class="token function">diff</span> histogram\n</code></pre>\n      </div>\n<h2>Verifying commits</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> config --global core.whitespace <span class="token string">"blank-at-eol,blank-at-eof,tab-in-indent"</span>\n</code></pre>\n      </div>\n<h2>Documenting Commits</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">wget</span> http://git.io/validate-commit-msg --show-progress --quiet -O .git/hooks/commit-msg\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">chmod</span> a+x .git/hooks/commit-msg\n</code></pre>\n      </div>\n<h2>Edit commit not pushed</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> commit --amend\n</code></pre>\n      </div>\n<h2>Sync Forked repository</h2>\n<p>Add the remote, call it “upstream”:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> remote add upstream https://github.com/whoever/whatever.git\n</code></pre>\n      </div>\n<p>Fetch all the branches of that remote into remote-tracking branches,\nsuch as upstream/master:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> fetch upstream\n</code></pre>\n      </div>\n<p>Make sure that you’re on your master branch:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> checkout master\n</code></pre>\n      </div>\n<p>Rewrite your master branch so that any commits of yours that\naren’t already in upstream/master are replayed on top of that\nother branch:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">git</span> rebase upstream/master\n</code></pre>\n      </div>',excerpt:"Enable Auto Complete, Commit with title and description, create alias, navigate history, update fork and more! Enable Auto Complete while...",fields:{tagSlugs:[{tag:"Git",link:"/en/tags/git/"},{tag:"version control",link:"/en/tags/version-control/"}],slug:"/en/blog/git/git-setup/",readNextPosts:[{excerpt:"",frontmatter:{title:"Functional Programming Examples",date:"2017-06-23"},fields:{slug:"/en/blog/functional-programming/examples/",langKey:"en"}},{excerpt:"",frontmatter:{title:"JS Spred Operator Examples",date:"2017-06-23"},fields:{slug:"/en/blog/js/spred-operator/",langKey:"en"}},{excerpt:"How to setup https / ssl for surge.sh and ssl.com, It was hard to grab all the pieces,\nSo I hope I can help who is in trouble. You can...",frontmatter:{title:"How to setup ssl https:// for your site",date:"2017-08-30"},fields:{slug:"/en/blog/static-site/setup-ssl/",langKey:"en"}}]},frontmatter:{youtubeId:null,title:"Advanced Git commands",tags:["Git","version control"],date:"2017-06-23",structuredData:{alternativeHeadline:"...",type:"TechArticle",dependencies:"A computer",proficiencyLevel:"Beginner",articleSection:"Git",pageEnd:"...",pageStart:"...",pagination:"...",about:{name:"Git",alternateName:"Github",description:"Git is a free and open source distributed version control system designed to handle everything from small to very large projects with speed and efficiency.",identifier:"git",image:"...",sameAs:"https://git-scm.com/"},accessMode:"textual",accessModeSufficient:"textual",accessibilityAPI:"ARIA",accessibilityControl:"fullKeyboardControl, fullTouchControl, fullMouseControl",accessibilitySummary:"...",aggregateRating:"...",audience:"...",author:"angeloocana",comment:"...",commentCount:"...",contentLocation:"...",dateCreated:"...",dateModified:"...",datePublished:"...",discussionUrl:"...",educationalUse:"...",isAccessibleForFree:!0,isFamilyFriendly:!0,keywords:"...",locationCreated:"Ottawa CA",thumbnailUrl:"...",version:1,video:"..."}}}},pathContext:{path:"/en/blog/git/git-setup/",langKey:"en"}}}});
//# sourceMappingURL=path---en-blog-git-git-setup-445f9dd284d9cb511c13.js.map