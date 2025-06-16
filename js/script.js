function submitPoll() {
  const choice = document.querySelector('input[name="poll"]:checked');
  if (!choice) {
    alert('Please select an option');
    return;
  }
  const key = choice.value;
  const counts = JSON.parse(localStorage.getItem('pollCounts') || '{}');
  counts[key] = (counts[key] || 0) + 1;
  localStorage.setItem('pollCounts', JSON.stringify(counts));
  showResults();
}

function showResults() {
  const counts = JSON.parse(localStorage.getItem('pollCounts') || '{}');
  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  const options = ['school','work','other'];
  const container = document.getElementById('pollResults');
  container.innerHTML = '';
  options.forEach(key => {
    const count = counts[key] || 0;
    const percent = total ? ((count/total*100).toFixed(1)) : 0;
    const div = document.createElement('div');
    div.textContent = key + ': ' + count + ' (' + percent + '%)';
    container.appendChild(div);
  });
  document.getElementById('pollForm').style.display = 'none';
  container.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function(){
  if(localStorage.getItem('pollCounts')) {
    showResults();
  }
});
