/* Scroll progress bar — shared across all Nexus pages */
(function(){
  var fill=document.querySelector(".scroll-bar-fill");
  if(!fill)return;
  function update(){
    var h=document.documentElement.scrollHeight-window.innerHeight;
    fill.style.width=h>0?(window.scrollY/h*100).toFixed(1)+"%":"0%";
  }
  window.addEventListener("scroll",update,{passive:true});
  update();
})();
