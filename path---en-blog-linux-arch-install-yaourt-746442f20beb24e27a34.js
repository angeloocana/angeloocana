webpackJsonp([0xd67888f29297],{"./node_modules/json-loader/index.js!./.cache/json/en-blog-linux-arch-install-yaourt.json":function(e,n){e.exports={data:{markdownRemark:{fileAbsolutePath:"/home/angeloocana/dev/angeloocana/src/pages/blog/linux/arch/install-yaourt.en.md",html:'<p>Yaourt is the community packager manager for Arch Linux.</p>\n<p>When you are using <strong>pacman</strong> (official packager manager), you do need to use <strong>sudo</strong>,\nwhen you are using <strong>yaourt</strong>, you don’t.</p>\n<p>Open the file below for editing:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> vim /etc/pacman.conf\n</code></pre>\n      </div>\n<p>Add it to the bottom:</p>\n<div class="gatsby-highlight">\n      <pre class="language-conf"><code>    [archlinuxfr]\n    SigLevel = Never\n    Server = http://repo.archlinux.fr/$arch</code></pre>\n      </div>\n<p>Install yaourt</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> pacman -Sy yaourt\n</code></pre>\n      </div>',excerpt:"Yaourt is the community packager manager for Arch Linux. When you are using  pacman  (official packager manager), you do need to use  sudo...",fields:{tagSlugs:[{tag:"Linux",link:"/en/tags/linux/"},{tag:"Arch",link:"/en/tags/arch/"}],slug:"/en/blog/linux/arch/install-yaourt/",readNextPosts:[{excerpt:"Install ZSH https://github.com/robbyrussell/oh-my-zsh/wiki/Installing-ZSH Install oh-my-zsh Download Install Make it your default shell...",frontmatter:{title:"Install ZSH and oh-my-zsh",date:"2017-06-23"},fields:{slug:"/en/blog/terminal/install-zsh/",langKey:"en"}},{excerpt:"If you want to learn this amazing language, here you can find my link collection of free content. Links Learn French with Vincent\n https...",frontmatter:{title:"Learn French links",date:"2017-08-03"},fields:{slug:"/en/blog/languages/french/learn-french-links/",langKey:"en"}},{excerpt:"Extract .rar Extract .zip Install unzip Extract file",frontmatter:{title:"Extract Files in Arch linux",date:"2017-07-31"},fields:{slug:"/en/blog/linux/arch/extract-files/",langKey:"en"}}]},frontmatter:{youtubeId:null,title:"How to install Yaourt on Arch linux",tags:["Linux","Arch"],date:"2017-08-26",structuredData:{alternativeHeadline:null,type:"TechArticle",dependencies:"Arch Linux",proficiencyLevel:"Beginner",articleSection:"Arch Linux",pageEnd:null,pageStart:null,pagination:null,about:{name:"Arch Linux",alternateName:"Arch",description:"lightweight and flexible Linux® distribution that tries to Keep It Simple.",identifier:"arch-linux",image:null,sameAs:"https://www.archlinux.org/"},accessMode:"textual",accessModeSufficient:"textual",accessibilityAPI:"ARIA",accessibilityControl:"fullKeyboardControl, fullTouchControl, fullMouseControl",accessibilitySummary:null,aggregateRating:"...",audience:"...",author:"angeloocana",comment:"...",commentCount:"...",contentLocation:"...",dateCreated:"2017-08-26",dateModified:"2017-08-30",datePublished:"2017-08-30",discussionUrl:"...",educationalUse:"...",isAccessibleForFree:!0,isFamilyFriendly:!0,keywords:"...",locationCreated:"Ottawa CA",thumbnailUrl:"...",version:1,video:"..."}}}},pathContext:{path:"/en/blog/linux/arch/install-yaourt/",langKey:"en"}}}});
//# sourceMappingURL=path---en-blog-linux-arch-install-yaourt-746442f20beb24e27a34.js.map