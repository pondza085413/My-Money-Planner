const revealItems = document.querySelectorAll(".feature-card, .steps article, .stat-panel, .price-card");
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, { threshold: 0.12 });

revealItems.forEach(item => {
  item.style.opacity = "0";
  item.style.transform = "translateY(18px)";
  item.style.transition = "0.5s ease";
  observer.observe(item);
});
