webpackJsonp([0xab4a3deb9b5e],{"./node_modules/json-loader/index.js!./.cache/json/en-blog-linux-arch-setup-nodejs-env.json":function(n,s){n.exports={data:{markdownRemark:{fileAbsolutePath:"/home/angeloocana/dev/angeloocana/src/pages/blog/linux/arch/setup-nodejs-env.en.md",html:'<h2>Install git</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> pacman -S <span class="token function">git</span>\n</code></pre>\n      </div>\n<h2>Install Nodejs</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> pacman -S nodejs\n</code></pre>\n      </div>\n<h2>Install NPM</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> pacman -S <span class="token function">npm</span>\n</code></pre>\n      </div>\n<h3>Fix global permissions error</h3>\n<p><a href="https://docs.npmjs.com/getting-started/fixing-npm-permissions">https://docs.npmjs.com/getting-started/fixing-npm-permissions</a></p>\n<p>Make a directory for global installations:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">mkdir</span> ~/.npm-global\n</code></pre>\n      </div>\n<p>Configure npm to use the new directory path:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">npm</span> config <span class="token keyword">set</span> prefix <span class="token string">\'~/.npm-global\'</span>\n</code></pre>\n      </div>\n<p>Open or create a ~/.profile file and add this line:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">export</span> PATH<span class="token operator">=</span>~/.npm-global/bin:<span class="token variable">$PATH</span>\n</code></pre>\n      </div>\n<p>Back on the command line, update your system variables:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">source</span> ~/.profile\n</code></pre>\n      </div>\n<h2>Install vs code</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    yaourt -S visual-studio-code\n</code></pre>\n      </div>\n<h2>Install Python for Gatsby</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> pacman -S python2\n</code></pre>\n      </div>',excerpt:"Install git Install Nodejs Install NPM Fix global permissions error https://docs.npmjs.com/getting-started/fixing-npm-permissions Make a...",fields:{tagSlugs:[{tag:"Linux",link:"/en/tags/linux/"},{tag:"Arch",link:"/en/tags/arch/"},{tag:"NodeJs",link:"/en/tags/node-js/"},{tag:"Dev env",link:"/en/tags/dev-env/"},{tag:"Npm",link:"/en/tags/npm/"},{tag:"Git",link:"/en/tags/git/"},{tag:"Vs code",link:"/en/tags/vs-code/"}],slug:"/en/blog/linux/arch/setup-nodejs-env/",readNextPosts:[{excerpt:"Move your font files to ",frontmatter:{title:"Install fonts in Arch linux",date:"2017-07-31"},fields:{slug:"/en/blog/linux/arch/install-fonts/",langKey:"en"}},{excerpt:"Vim is a old school text editor, It runs in the console, It is the faster of all.\nIt’s the best option for accessing servers through line...",frontmatter:{title:"Vim Help Commands",date:"2017-08-08"},fields:{slug:"/en/blog/vim/vim-help-commands/",langKey:"en"}},{excerpt:"Do you need Word and Excel on linux?\nFollow my steps to install LibreOffice an open source option for linux distros. Install LibreOffice...",frontmatter:{title:"How to use Word and Excel on Linux or maybe not...",date:"2017-08-30"},fields:{slug:"/en/blog/linux/arch/install-libre-office/",langKey:"en"}}]},frontmatter:{youtubeId:null,title:"Setup dev env Arch linux",tags:["Linux","Arch","NodeJs","Dev env","Npm","Git","Vs code"],date:"2017-07-30",structuredData:null}}},pathContext:{path:"/en/blog/linux/arch/setup-nodejs-env/",langKey:"en"}}}});
//# sourceMappingURL=path---en-blog-linux-arch-setup-nodejs-env-98872f9a55e49f61b2d5.js.map