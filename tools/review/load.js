// core.js を（必要なら書き換えて）読み込む
const fs=require('fs');
module.exports=function(patch){let src=fs.readFileSync(__dirname+'/../../src/core.js','utf8');if(patch)src=patch(src);
const names=['eU','eB','gmU','gmB','hMix','eMix','gmMix','cvMix','SLf','burn','NY','Core','mkP','D','PI','P4','R','K','gmT','cpT','cvT','geo','kin','TI','TA','TX','ATOL','EIX','mdot','psiF','lift','Aeff','md4'];
return (0,eval)('(function(){'+src+';return {'+names.map(n=>n+':typeof '+n+'!=="undefined"?'+n+':undefined').join(',')+'}})()')};
