webpackJsonp([0xf18a42ecb8a3],{"./node_modules/json-loader/index.js!./.cache/json/fr-blog-linux-arch-install-yaourt.json":function(e,a){e.exports={data:{markdownRemark:{fileAbsolutePath:"/home/angeloocana/dev/angeloocana/src/pages/blog/linux/arch/install-yaourt.fr.md",html:'<p>Yaourt est le gestionnaire de paquets de communauté pour Arch Linux.</p>\n<p>Lorsque vous utilisez <strong>pacman</strong> (gestionnaire de paquetage officiel), vous devez utiliser <strong>sudo</strong>,\npour le <strong>yaourt</strong> vous n’avez pas à le faire.</p>\n<p>Ouvrez le fichier ci-dessous pour l’édition:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> vim /etc/pacman.conf\n</code></pre>\n      </div>\n<p>Ajoutez ceci à la fin du fichier:</p>\n<div class="gatsby-highlight">\n      <pre class="language-conf"><code>    [archlinuxfr]\n    SigLevel = Never\n    Server = http://repo.archlinux.fr/$arch</code></pre>\n      </div>\n<p>Installer yaourt</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> pacman -Sy yaourt\n</code></pre>\n      </div>',excerpt:"Yaourt est le gestionnaire de paquets de communauté pour Arch Linux. Lorsque vous utilisez  pacman  (gestionnaire de paquetage officiel...",fields:{tagSlugs:[{tag:"Linux",link:"/fr/tags/linux/"},{tag:"Arch",link:"/fr/tags/arch/"}],slug:"/fr/blog/linux/arch/install-yaourt/",readNextPosts:[{excerpt:"Cette erreur se produit lorsque vous regardez de nombreux fichiers dans linux. Vous pouvez recevoir un message d’erreur comme ceci: error...",frontmatter:{title:"Correction de l'erreur ENOSPC",date:"2017-09-03"},fields:{slug:"/fr/blog/linux/arch/fix-enospc-error/",langKey:"fr"}},{excerpt:"Ne perdez plus vos fichiers! Gardez une trace du changement d’historique, enregistrez le nuage et soyez en sécurité. Ici, vous apprendrez...",frontmatter:{title:"10 conseils pour commencer à utiliser Github et la ligne de commande",date:"2017-09-21"},fields:{slug:"/fr/blog/git/10-tips-to-start-using-github-and-cmd/",langKey:"fr"}},{excerpt:"",frontmatter:{title:"Exemplos Programação Funcional",date:"2017-06-23"},fields:{slug:"/fr/blog/functional-programming/examples/",langKey:"fr"}}]},frontmatter:{youtubeId:null,title:"Comment installer Yaourt sur Arch Linux",tags:["Linux","Arch"],date:"2017-08-30",structuredData:{alternativeHeadline:null,type:"TechArticle",dependencies:"Arch Linux",proficiencyLevel:"Beginner",articleSection:"Arch Linux",pageEnd:null,pageStart:null,pagination:null,about:{name:"Arch Linux",alternateName:"Arch",description:"lightweight and flexible Linux® distribution that tries to Keep It Simple.",identifier:"arch-linux",image:null,sameAs:"https://www.archlinux.org/"},accessMode:"textual",accessModeSufficient:"textual",accessibilityAPI:"ARIA",accessibilityControl:"fullKeyboardControl, fullTouchControl, fullMouseControl",accessibilitySummary:null,aggregateRating:"...",audience:"...",author:"angeloocana",comment:"...",commentCount:"...",contentLocation:"...",dateCreated:"2017-08-26",dateModified:"2017-08-30",datePublished:"2017-08-30",discussionUrl:"...",educationalUse:"...",isAccessibleForFree:!0,isFamilyFriendly:!0,keywords:"...",locationCreated:"Ottawa CA",thumbnailUrl:"...",version:1,video:"..."}}}},pathContext:{path:"/fr/blog/linux/arch/install-yaourt/",langKey:"fr"}}}});
//# sourceMappingURL=path---fr-blog-linux-arch-install-yaourt-e7bd217ea30f56a2fd06.js.map