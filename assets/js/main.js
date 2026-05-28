document.addEventListener('DOMContentLoaded', function() {

  // ─── Particle Network ────────────────────────────────────────
  var canvas = document.getElementById('particle-canvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var mouse = { x: null, y: null };
    var isLight = document.body.classList.contains('light');

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    document.addEventListener('mousemove', function(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    var density = Math.min(80, Math.floor(window.innerWidth / 12));
    for (var i = 0; i < density; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.8 + 0.8
      });
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var lineColor = isLight ? '9, 105, 218' : '121, 192, 255';
      var dotColor = isLight ? '9, 105, 218' : '121, 192, 255';

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var dx = p.x - q.x;
          var dy = p.y - q.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(' + lineColor + ', ' + (0.06 * (1 - dist / 150)) + ')';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + dotColor + ', 0.25)';
        ctx.fill();
      }

      // Mouse interaction
      if (mouse.x !== null) {
        for (var k = 0; k < particles.length; k++) {
          var pk = particles[k];
          var dxm = pk.x - mouse.x;
          var dym = pk.y - mouse.y;
          var distm = Math.sqrt(dxm * dxm + dym * dym);
          if (distm < 180) {
            ctx.beginPath();
            ctx.moveTo(pk.x, pk.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = 'rgba(' + lineColor + ', ' + (0.08 * (1 - distm / 180)) + ')';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }

  // ─── Live Timestamp ─────────────────────────────────────────
  var ts = document.getElementById('live-timestamp');
  if (ts) {
    function updateTimestamp() {
      var now = new Date();
      var dateStr = now.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
      var timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
      ts.textContent = dateStr + ' ' + timeStr + ' UTC+' + Math.floor(-now.getTimezoneOffset() / 60);
    }
    updateTimestamp();
    setInterval(updateTimestamp, 1000);
  }

  // ─── Terminal Typing ────────────────────────────────────────
  var terminalCmd = document.getElementById('terminal-cmd');
  if (terminalCmd) {
    var commands = [
      'whoami && cat ~/about.txt',
      'kubectl get pods -A',
      'terraform plan',
      'helm list -A',
      'curl -s https://canoglu.dev | grep "DevOps"',
      'systemctl status --full',
      'docker ps --format "table {{.Names}}"',
      'git log --oneline -5',
      'ansible-playbook site.yml --check',
      'kubectl exec -it $(whoami) -- /bin/bash'
    ];
    var cmdIndex = 0;
    var charIndex = 0;
    var isDeleting = false;
    var typeSpeed = 35;

    function typeLoop() {
      var current = commands[cmdIndex];
      if (!isDeleting) {
        terminalCmd.textContent = current.substring(0, charIndex + 1);
        charIndex++;
        if (charIndex === current.length) {
          setTimeout(function() { isDeleting = true; typeLoop(); }, 2000);
          return;
        }
        setTimeout(typeLoop, typeSpeed + Math.random() * 25);
      } else {
        terminalCmd.textContent = current.substring(0, charIndex);
        charIndex--;
        if (charIndex < 0) {
          isDeleting = false;
          charIndex = 0;
          cmdIndex = (cmdIndex + 1) % commands.length;
          setTimeout(typeLoop, 300);
          return;
        }
        setTimeout(typeLoop, typeSpeed / 2);
      }
    }
    setTimeout(typeLoop, 500);
  }

  // ─── Quote Rotator ──────────────────────────────────────────
  var quoteText = document.getElementById('quote-text');
  var quoteAuthor = document.getElementById('quote-author');
  if (quoteText && quoteAuthor) {
    var quotes = [
      { text: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.', author: 'Martin Fowler' },
      { text: 'DevOps is not a goal, but a never-ending process of continual improvement.', author: 'Jez Humble' },
      { text: 'Containers are not about virtualizing machines; they are about virtualizing the operating system.', author: 'Unknown' },
      { text: 'Automation is not about replacing humans; it is about freeing them to do what they do best.', author: 'Gene Kim' },
      { text: 'The best way to build resilient systems is to embrace failure, not to prevent it.', author: 'Unknown' },
      { text: 'Kubernetes is not a platform; it is a platform for building platforms.', author: 'Kelsey Hightower' },
      { text: 'Infrastructure as Code is not a choice; it is a requirement.', author: 'Kief Morris' },
      { text: 'Observability is about asking arbitrary questions without having to deploy new code.', author: 'Charity Majors' },
      { text: 'If you can\'t measure it, you can\'t improve it.', author: 'Peter Drucker' },
      { text: 'The cloud is just someone else\'s computer.', author: 'Unknown' }
    ];
    var qIndex = 0;
    quoteText.textContent = quotes[0].text;
    quoteAuthor.textContent = '— ' + quotes[0].author;

    setInterval(function() {
      qIndex = (qIndex + 1) % quotes.length;
      quoteText.style.opacity = '0';
      quoteAuthor.style.opacity = '0';
      setTimeout(function() {
        quoteText.textContent = quotes[qIndex].text;
        quoteAuthor.textContent = '— ' + quotes[qIndex].author;
        quoteText.style.opacity = '1';
        quoteAuthor.style.opacity = '1';
      }, 300);
    }, 8000);
  }

  // ─── Metrics Counter ────────────────────────────────────────
  var metricEls = document.querySelectorAll('.metric-value');
  if (metricEls.length > 0) {
    function animateMetrics() {
      metricEls.forEach(function(el) {
        var target = parseInt(el.getAttribute('data-target'));
        var suffix = el.getAttribute('data-suffix') || '';
        var duration = 1500;
        var start = performance.now();

        function update(now) {
          var elapsed = now - start;
          var progress = Math.min(elapsed / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          var current = Math.floor(eased * target);
          el.textContent = current + suffix;
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
      });
    }

    var observed = false;
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !observed) {
          observed = true;
          animateMetrics();
        }
      });
    }, { threshold: 0.3 });
    var metricsRow = document.getElementById('metrics-row');
    if (metricsRow) observer.observe(metricsRow);
  }

  // ─── Theme Toggle ───────────────────────────────────────────
  var toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    var saved = localStorage.getItem('theme');
    if (saved === 'light') {
      document.body.classList.add('light');
      toggleBtn.textContent = '☀️';
    }

    toggleBtn.addEventListener('click', function() {
      document.body.classList.toggle('light');
      var isLight = document.body.classList.contains('light');
      toggleBtn.textContent = isLight ? '☀️' : '🌙';
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      isLight = isLight;
    });
  }

  // ─── Active nav on scroll ──────────────────────────────────
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.hero-nav-link');

  function updateActiveNav() {
    if (!sections.length || !navLinks.length) return;
    var scrollY = window.scrollY + 120;
    var current = '';

    sections.forEach(function(section) {
      var top = section.offsetTop;
      var height = section.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(function(link) {
      link.classList.remove('active');
      var href = link.getAttribute('href');
      if (current && href === '/#' + current) link.classList.add('active');
      if (!current && href === '/') link.classList.add('active');
    });
  }

  if (sections.length > 0 && navLinks.length > 0) {
    window.addEventListener('scroll', updateActiveNav);
    updateActiveNav();
  }
});
