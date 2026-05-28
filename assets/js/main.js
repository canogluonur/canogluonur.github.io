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

  // ─── Terminal Typing Sequence ───────────────────────────────
  var terminal = document.getElementById('terminal');
  if (terminal) {
    var lines = terminal.querySelectorAll('.terminal-line');
    var outputs = terminal.querySelectorAll('.terminal-output');
    var typeSpeed = 40;
    var pauseAfterCmd = 300;
    var pauseAfterOutput = 200;

    function typeText(element, text, callback) {
      var i = 0;
      element.textContent = '';
      element.appendChild(document.createElement('span'));
      var span = element.querySelector('span');
      var cursorSpan = document.createElement('span');
      cursorSpan.className = 'typing-cursor';
      element.appendChild(cursorSpan);

      function type() {
        if (i < text.length) {
          span.textContent += text.charAt(i);
          i++;
          setTimeout(type, typeSpeed + Math.random() * 30);
        } else {
          if (cursorSpan.parentNode) cursorSpan.remove();
          if (callback) callback();
        }
      }
      type();
    }

    function runSequence(index) {
      if (index >= lines.length) return;
      var line = lines[index];
      var cmd = line.getAttribute('data-cmd');
      var promptOnly = line.getAttribute('data-prompt-only') === 'true';

      line.innerHTML = '';
      var promptSpan = document.createElement('span');
      promptSpan.className = 'prompt';
      promptSpan.textContent = '$';
      line.appendChild(promptSpan);

      var cmdSpan = document.createElement('span');
      cmdSpan.className = 'cmd';
      line.appendChild(cmdSpan);

      if (promptOnly) {
        cmdSpan.innerHTML = '_<span class="cursor"></span>';
        if (index === lines.length - 1) {
          setTimeout(enableInteractiveMode, 500);
          return;
        }
        runSequence(index + 1);
        return;
      }

      typeText(cmdSpan, cmd, function() {
        setTimeout(function() {
          if (outputs[index]) {
            outputs[index].classList.add('visible');
          }
          setTimeout(function() {
            runSequence(index + 1);
          }, pauseAfterOutput);
        }, pauseAfterCmd);
      });
    }

    runSequence(0);
  }

  // ─── Interactive Terminal ───────────────────────────────────
  var interactiveActive = false;
  var cmdHistory = [];
  var histIdx = 0;
  var deployDate = new Date();
  var cwd = '/home/onur/canogluonur.github.io';

  var virtualFS = {
    '/home/onur/canogluonur.github.io': {
      'about.txt': 'Cloud-native infrastructure architect. Building scalable, resilient systems with Kubernetes, GitOps, and observability.',
      'skills.txt': 'Kubernetes, Docker, Helm, ArgoCD, Terraform, Ansible, AWS, Azure, Prometheus, Grafana, Elasticsearch, Kibana, Kafka, RabbitMQ, PostgreSQL, MongoDB, Redis, Linux, Vault, GitLab CI, GitHub Actions',
      'contact.md': 'GitHub: onurcanoglu | LinkedIn: onurcanoglu | Medium: @onurcanoglu | Email: onurcanoglu7@gmail.com',
      'roles/': null,
      'projects/': null,
      'certs/': null
    },
    '/home/onur/canogluonur.github.io/roles': {
      'tatilbudur.md': 'DevOps Specialist @ TatilBudur (Oct 2025 - Present)',
      'artifact-systems.md': 'DevOps Engineer @ Artifact Systems (Aug 2024 - Oct 2025)',
      'hexaworks.md': 'DevOps Engineer @ Hexaworks (Nov 2022 - Aug 2024)',
      'aras-kargo.md': 'DevOps Intern @ Aras Kargo (Mar 2022 - Jun 2022)'
    },
    '/home/onur/canogluonur.github.io/projects': {
      'project-1': 'Kubernetes cluster automation',
      'project-2': 'GitOps pipeline with ArgoCD',
      'project-3': 'Observability stack with Prometheus/Grafana/Loki/Tempo',
      'project-4': 'Multi-cloud Terraform infrastructure',
      'project-5': 'CI/CD pipeline with GitHub Actions',
      'and-25-more': '... too many to list!'
    },
    '/home/onur/canogluonur.github.io/certs': {
      'CKA': 'Certified Kubernetes Administrator',
      'KCNA': 'Kubernetes and Cloud Native Associate',
      'kcd-istanbul-organizer': 'KCD Istanbul 2023 Organizer',
      'kubesphere-ambassador': 'KubeSphere Ambassador 2023'
    }
  };

  function resolvePath(path) {
    if (!path || path === '~') return '/home/onur/canogluonur.github.io';
    if (path === '/') return '/home/onur/canogluonur.github.io';
    if (path.startsWith('/')) return path;
    if (path.startsWith('./')) path = path.slice(2);
    var parts = path.split('/');
    var cwdParts = cwd.split('/');
    for (var pi = 0; pi < parts.length; pi++) {
      if (parts[pi] === '..') {
        if (cwdParts.length > 4) cwdParts.pop();
      } else if (parts[pi] === '.' || parts[pi] === '') {
        continue;
      } else {
        cwdParts.push(parts[pi]);
      }
    }
    return cwdParts.join('/');
  }

  function listDir(dir) {
    var entries = virtualFS[dir];
    if (!entries) return null;
    var files = [], dirs = [];
    for (var key in entries) {
      if (key.endsWith('/')) dirs.push(key);
      else files.push(key);
    }
    return { files: files, dirs: dirs };
  }

  function enableInteractiveMode() {
    if (interactiveActive) return;
    interactiveActive = true;
    cmdHistory = [];

    var promptLine = document.querySelector('.terminal-line[data-prompt-only="true"]');
    if (promptLine) promptLine.style.display = 'none';

    var row = document.getElementById('term-input-row');
    var input = document.getElementById('term-input');
    var hint = document.getElementById('term-hint');
    if (row) row.style.display = 'flex';
    if (input) {
      input.removeEventListener('keydown', handleTerminalInput);
      input.addEventListener('keydown', handleTerminalInput);
      input.focus();
    }

    var term = document.getElementById('terminal');
    if (term) {
      term.addEventListener('click', function() {
        var inp = document.getElementById('term-input');
        if (inp) inp.focus();
      });
    }

    if (input && hint) {
      input.addEventListener('input', function() {
        var h = document.getElementById('term-hint');
        if (h) h.style.display = 'none';
      }, { once: true });
    }
  }

  var _processing = false;

  function handleTerminalInput(e) {
    if (!interactiveActive || _processing) return;
    var input = e.target;
    if (e.key === 'Enter') {
      _processing = true;
      e.preventDefault();
      var cmd = input.value.trim();
      input.value = '';

      if (cmd) {
        cmdHistory.push(cmd);
        histIdx = cmdHistory.length;
        showCommandLine(cmd);
        showCommandOutput(cmd);
      }

      input.focus();
      _processing = false;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx > 0) {
        histIdx--;
        input.value = cmdHistory[histIdx];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < cmdHistory.length - 1) {
        histIdx++;
        input.value = cmdHistory[histIdx];
      } else {
        histIdx = cmdHistory.length;
        input.value = '';
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      clearTerminal();
    }
  }

  function showCommandLine(cmd) {
    var terminal = document.getElementById('terminal');
    if (!terminal) return;
    var line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = '<span class="prompt">$</span><span class="cmd">' + cmd + '</span>';
    var row = document.getElementById('term-input-row');
    if (row) {
      terminal.insertBefore(line, row);
    } else {
      terminal.appendChild(line);
    }
  }

  function showCommandOutput(cmd) {
    var terminal = document.getElementById('terminal');
    if (!terminal) return;
    var html = getOutputForCommand(cmd);

    var out = document.createElement('div');
    out.className = 'terminal-output visible';
    out.style.cssText = 'opacity:1;max-height:none;overflow:visible;margin-bottom:0;';
    out.innerHTML = html;

    var row = document.getElementById('term-input-row');
    if (row) {
      terminal.insertBefore(out, row);
    } else {
      terminal.appendChild(out);
    }
  }

  function clearTerminal() {
    var terminal = document.getElementById('terminal');
    if (!terminal) return;
    var lines = terminal.querySelectorAll('.terminal-line');
    var outputs = terminal.querySelectorAll('.terminal-output');
    lines.forEach(function(l) { if (l !== lines[0]) l.remove(); });
    outputs.forEach(function(o) { o.remove(); });
    // Also clear command lines inserted by user (but keep the first 3 boot lines)
    var all = terminal.children;
    var keep = [];
    for (var ci = 0; ci < all.length; ci++) {
      var el = all[ci];
      if (el.classList.contains('terminal-line') || el.classList.contains('terminal-output')) {
        if (ci < 7) keep.push(el); // first 7 elements are boot sequence
        else el.remove();
      }
    }
    var inp = document.getElementById('term-input');
    if (inp) { inp.value = ''; inp.focus(); }
  }

  function getUptimeStr() {
    var diff = Math.floor((Date.now() - deployDate.getTime()) / 1000);
    var days = Math.floor(diff / 86400);
    var hours = Math.floor((diff % 86400) / 3600);
    var mins = Math.floor((diff % 3600) / 60);
    return days + 'd ' + hours + 'h ' + mins + 'm';
  }

  function randomMatrixChar() {
    var chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
    return chars[Math.floor(Math.random() * chars.length)];
  }
  function randomMatrixLine() {
    var len = Math.floor(Math.random() * 30 + 20);
    var line = '';
    for (var mi = 0; mi < len; mi++) {
      if (Math.random() < 0.1) line += ' ';
      else line += randomMatrixChar();
    }
    return line;
  }

  function getOutputForCommand(input) {
    var parts = input.trim().split(/\s+/);
    var cmd = parts[0].toLowerCase();
    var args = parts.slice(1);

    switch (cmd) {
      case 'whoami':
        return '<div style="padding:2px 0 4px;"><div style="font-size:1.4rem;font-weight:700;color:var(--text-bright);">Onur Cano\u011flu</div><div style="color:var(--purple);font-size:0.82rem;">DevOps Engineer</div></div>';

      case 'help':
        return [
          'Available commands:',
          '',
          '  <span style="color:var(--cyan);">whoami</span>         Display user info',
          '  <span style="color:var(--cyan);">about</span>          Show bio',
          '  <span style="color:var(--cyan);">roles</span>          List experience',
          '  <span style="color:var(--cyan);">skills</span>         List technical skills',
          '  <span style="color:var(--cyan);">ls / ls -la</span>    List files',
          '  <span style="color:var(--cyan);">cd</span>             Change directory',
          '  <span style="color:var(--cyan);">cat</span>            Read a file',
          '  <span style="color:var(--cyan);">education</span>      Show education &amp; certs',
          '  <span style="color:var(--cyan);">contact</span>        Show contact info',
          '  <span style="color:var(--cyan);">contact</span>        Show contact info',
          '  <span style="color:var(--cyan);">uptime</span>         Show system uptime',
          '  <span style="color:var(--cyan);">uname</span>          Print system information',
          '  <span style="color:var(--cyan);">date</span>           Show current date/time',
          '  <span style="color:var(--cyan);">neofetch</span>       Display system info',
          '  <span style="color:var(--cyan);">history</span>        Show command history',
          '  <span style="color:var(--cyan);">clear</span>          Clear terminal (Ctrl+L)',
          '  <span style="color:var(--cyan);">help</span>           Show this help',
          '  <span style="color:var(--cyan);">echo</span>           Echo text back',
          '  <span style="color:var(--cyan);">banner</span>         Show ASCII banner',
          '  <span style="color:var(--cyan);">cowsay</span>         Cow says...',
          '  <span style="color:var(--cyan);">fortune</span>        Random quote',
          '  <span style="color:var(--cyan);">curl</span>           HTTP request simulation',
          '  <span style="color:var(--cyan);">ping</span>           Ping simulation',
          '  <span style="color:var(--cyan);">pwd</span>            Print working directory',
          '  <span style="color:var(--cyan);">df</span>             Disk usage',
          '  <span style="color:var(--cyan);">who</span>            Who is logged in',
          '  <span style="color:var(--cyan);">sudo</span>           Try root access',
          '  <span style="color:var(--cyan);">exit</span>           Nice try',
          '  <span style="color:var(--cyan);">vim</span> / <span style="color:var(--cyan);">emacs</span>   Easter eggs',
          '  <span style="color:var(--cyan);">figlet</span>         ASCII art text',
          '  <span style="color:var(--cyan);">lolcat</span>         Rainbow text',
          '  <span style="color:var(--cyan);">cmatrix</span>        Matrix rain'
        ].join('\n');

      case 'about':
        return 'Cloud-native infrastructure architect. Building scalable, resilient systems with Kubernetes, GitOps, and observability.';

      case 'roles':
      case 'experience':
        return [
          '<div style="display:flex;flex-direction:column;gap:6px;padding:4px 0;">',
          '  <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;">',
          '    <span style="color:var(--text-bright);font-weight:600;">DevOps Specialist</span>',
          '    <span style="color:var(--cyan);font-size:0.72rem;">@ TatilBudur</span>',
          '    <span style="color:var(--text-dim);font-size:0.68rem;">Oct 2025 \u2014 Present</span>',
          '  </div>',
          '  <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;">',
          '    <span style="color:var(--text-bright);font-weight:600;">DevOps Engineer</span>',
          '    <span style="color:var(--cyan);font-size:0.72rem;">@ Artifact Systems</span>',
          '    <span style="color:var(--text-dim);font-size:0.68rem;">Aug 2024 \u2014 Oct 2025</span>',
          '  </div>',
          '  <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;">',
          '    <span style="color:var(--text-bright);font-weight:600;">DevOps Engineer</span>',
          '    <span style="color:var(--cyan);font-size:0.72rem;">@ Hexaworks</span>',
          '    <span style="color:var(--text-dim);font-size:0.68rem;">Nov 2022 \u2014 Aug 2024</span>',
          '  </div>',
          '  <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;">',
          '    <span style="color:var(--text-bright);font-weight:600;">DevOps Intern</span>',
          '    <span style="color:var(--cyan);font-size:0.72rem;">@ Aras Kargo</span>',
          '    <span style="color:var(--text-dim);font-size:0.68rem;">Mar 2022 \u2014 Jun 2022</span>',
          '  </div>',
          '</div>'
        ].join('\n');

      case 'skills':
        var skillList = ['Kubernetes', 'Docker', 'Helm', 'ArgoCD', 'Terraform', 'Ansible', 'AWS', 'Azure', 'Prometheus', 'Grafana', 'Elasticsearch', 'Kibana', 'Kafka', 'RabbitMQ', 'PostgreSQL', 'MongoDB', 'Redis', 'Linux', 'Vault', 'GitLab CI', 'GitHub Actions'];
        return [
          '<div style="padding:6px 0;line-height:2;">',
          skillList.map(function(s) {
            return '<span style="display:inline-block;padding:2px 10px;margin:2px 3px;background:rgba(121,192,255,0.08);border:1px solid rgba(121,192,255,0.12);border-radius:12px;font-size:0.72rem;color:var(--cyan);">' + s + '</span>';
          }).join(''),
          '</div>'
        ].join('\n');

      case 'education':
        return [
          '<div style="padding:4px 0;">',
          '  <div style="color:var(--text-bright);font-weight:600;">Computer Engineering</div>',
          '  <div style="color:var(--text-dim);font-size:0.78rem;">Bachelor\'s Degree</div>',
          '  <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">',
          '    <span style="padding:2px 10px;background:rgba(126,231,135,0.1);border:1px solid rgba(126,231,135,0.2);border-radius:12px;font-size:0.72rem;color:var(--green);">CKA</span>',
          '    <span style="padding:2px 10px;background:rgba(126,231,135,0.1);border:1px solid rgba(126,231,135,0.2);border-radius:12px;font-size:0.72rem;color:var(--green);">KCNA</span>',
          '    <span style="padding:2px 10px;background:rgba(126,231,135,0.1);border:1px solid rgba(126,231,135,0.2);border-radius:12px;font-size:0.72rem;color:var(--green);">KCD Istanbul Organizer</span>',
          '    <span style="padding:2px 10px;background:rgba(126,231,135,0.1);border:1px solid rgba(126,231,135,0.2);border-radius:12px;font-size:0.72rem;color:var(--green);">KubeSphere Ambassador 2023</span>',
          '  </div>',
          '</div>'
        ].join('\n');

      case 'contact':
        return [
          '<div style="display:flex;flex-direction:column;gap:5px;padding:4px 0;">',
          '  <div><span style="color:var(--text-dim);">GitHub:</span> <a href="https://github.com/onurcanoglu" target="_blank" style="color:var(--cyan);text-decoration:none;border-bottom:1px dashed var(--cyan);">onurcanoglu</a></div>',
          '  <div><span style="color:var(--text-dim);">LinkedIn:</span> <a href="https://linkedin.com/in/onurcanoglu" target="_blank" style="color:var(--cyan);text-decoration:none;border-bottom:1px dashed var(--cyan);">onurcanoglu</a></div>',
          '  <div><span style="color:var(--text-dim);">Medium:</span> <a href="https://medium.com/@onurcanoglu" target="_blank" style="color:var(--cyan);text-decoration:none;border-bottom:1px dashed var(--cyan);">@onurcanoglu</a></div>',
          '  <div><span style="color:var(--text-dim);">Email:</span> <a href="mailto:onurcanoglu7@gmail.com" style="color:var(--cyan);text-decoration:none;border-bottom:1px dashed var(--cyan);">onurcanoglu7@gmail.com</a></div>',
          '</div>'
        ].join('\n');

      case 'uptime': {
        var now = new Date();
        var diff = Math.floor((now - deployDate) / 1000);
        var days = Math.floor(diff / 86400);
        var hours = Math.floor((diff % 86400) / 3600);
        var mins = Math.floor((diff % 3600) / 60);
        return ' ' + now.toLocaleTimeString('en-US', { hour12: false }) + ' up ' + days + ' day' + (days !== 1 ? 's' : '') + ', ' + hours + ':' + (mins < 10 ? '0' : '') + mins + ',  1 user,  load average: 0.00, 0.01, 0.05';
      }

      case 'uname':
        if (args.indexOf('-a') !== -1) return 'Linux canogluonur 6.8.0-31-generic #31-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux';
        return 'Linux';

      case 'date':
        return new Date().toString();

      case 'neofetch':
        return [
          '<div style="display:flex;gap:16px;padding:6px 0;font-size:0.78rem;line-height:1.5;flex-wrap:wrap;">',
          '  <pre style="color:var(--cyan);margin:0;font-size:0.55rem;line-height:1.15;">',
          '       .-/+oossssoo+/-.',
          '    \`:+ssssssssssssssssss+:\`',
          '  -+ssssssssssssssssssyyssss+-',
          ' .ossssssssssssssssssdMMMNysssso.',
          '/ssssssssshdmmNNmmyNMMMMhssssss/',
          '+sssssssshmydMMMMMMMNddddysssssss+',
          '/sssssssshNMMMyhhyyyyhmNMMMNhssssss/',
          '.ssssssssdMMMNhsssssssssshNMMMdssssss.',
          ' +ssssssssdMMMNhsssssssssshNMMMdssssss+',
          '  -ssssssssdMMMNhsssssssssshNMMMdssssss-',
          '    :ssssssssdMMMNhsssssssssshNMMMdssssss:',
          '     \`:++ossssdMMMNhsssssssssshNMMMdssssso',
          '        \`:/osssdMMMNhsssssssssshNMMMdsssss/',
          '            .osssdMMMNhsssssssssshNMMMdssss:',
          '              \`:++o+/-NMMMMNNNNNNMMMMMMMNy+/',
          '                 \`\`\`\`/yNMMMMMMMMMMMMMMMMMMy/',
          '                      \`\`.\`\`-/+osssso/+-\`.\`\`',
          '                            \`\`',
          '  </pre>',
          '  <div>',
          '    <b style="color:var(--text-bright);">onur@devops</b>',
          '    <span style="color:var(--text-dim);">-----------------</span>',
          '    <span style="color:var(--text-dim);">OS:</span> GitHub Pages x86_64',
          '    <span style="color:var(--text-dim);">Host:</span> canogluonur.github.io',
          '    <span style="color:var(--text-dim);">Kernel:</span> Jekyll 3.9.0',
          '    <span style="color:var(--text-dim);">Shell:</span> bash 5.2',
          '    <span style="color:var(--text-dim);">Uptime:</span> ' + getUptimeStr(),
          '    <span style="color:var(--text-dim);">Packages:</span> 42 (gem)',
          '    <span style="color:var(--text-dim);">Terminal:</span> xterm-256color',
          '    <span style="color:var(--text-dim);">CPU:</span> Apple M3 Pro',
          '    <span style="color:var(--text-dim);">Memory:</span> 1842MiB / 16384MiB',
          '  </div>',
          '</div>'
        ].join('\n');

      case 'history':
        if (cmdHistory.length === 0) return '  No commands in history.';
        return cmdHistory.map(function(h, i) {
          return '  ' + (i + 1) + '  ' + h;
        }).join('\n');

      case 'pwd':
        return cwd;

      case 'cd':
        var target = args.join(' ') || '~';
        var newDir = resolvePath(target);
        if (!virtualFS[newDir]) return '  cd: ' + target + ': No such directory';
        cwd = newDir;
        return '';

      case 'echo':
        return args.join(' ') || '';

      case 'banner':
        return [
          '<pre style="color:var(--green);font-size:0.55rem;line-height:1.15;">',
          '   ______          _                  ________                           ',
          '  / ____/___ _    (_)___  ____ _     / ____/ /_  ____ _____  ____  ____ _',
          ' / /   / __ \`/___/ / __ \\/ __ \`/    / /   / __ \\/ __ \`/ __ \\/ __ \\/ __ \`/',
          '/ /___/ /_/ /___/ / / / / /_/ /    / /___/ / / / /_/ / /_/ / /_/ / /_/ /',
          '\\____/\\__,_/   /_/_/ /_/\\__, /     \\____/_/ /_/\\__, /\\____/\\____/\\__, /',
          '                       /____/                 /____/            /____/ ',
          '</pre>'
        ].join('\n');

      case 'cowsay':
        var msg = args.join(' ') || 'Moo! Welcome to my site!';
        var border = '';
        for (var bi = 0; bi < msg.length + 2; bi++) border += '-';
        return [
          '  ' + border,
          '  < ' + msg + ' >',
          '  ' + border,
          '        \\   ^__^',
          '         \\  (oo)\\_______',
          '            (__)\\       )\\/\\',
          '                ||----w |',
          '                ||     ||'
        ].join('\n');

      case 'fortune':
        var quotes = [
          '"The cloud is just someone else\'s computer." \u2014 Unknown',
          '"It works on my machine." \u2014 Every Developer',
          '"There are only 10 types of people in the world: those who understand binary and those who don\'t."',
          '"sudo rm -rf / \u2014 Said no one ever... hopefully."',
          '"In order to understand recursion, you must first understand recursion."',
          '"A journey of a thousand miles begins with a single `git commit`."',
          '"Containers are just Linux with extra steps."',
          '"DevOps is not a role, it\'s a lifestyle."',
          '"The best error message is the one that never appears."'
        ];
        return '  ' + quotes[Math.floor(Math.random() * quotes.length)];

      case 'figlet': {
        var figText = args.join(' ') || 'onur';
        // Simple block-style ASCII art
        var art = [
          '  ███████  ██████  ███    ██ ██    ██ ██████  ',
          '  ██      ██    ██ ████   ██ ██    ██ ██   ██ ',
          '  █████   ██    ██ ██ ██  ██ ██    ██ ██████  ',
          '  ██      ██    ██ ██ ██  ██ ██    ██ ██   ██ ',
          '  ██       ██████  ██   ████  ██████  ██   ██ '
        ];
        return '<pre style="color:var(--green);font-size:0.5rem;line-height:1.15;margin:4px 0;">' + art.join('\n') + '</pre><div style="color:var(--text-dim);font-size:0.7rem;">  ' + figText + '</div>';
      }

      case 'lolcat':
        if (args.length === 0) return '  lolcat: missing operand';
        var lolText = args.join(' ');
        var rainbow = '';
        var colors = ['#ff6b6b', '#ffa500', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6'];
        for (var li = 0; li < lolText.length; li++) {
          var c = colors[li % colors.length];
          rainbow += '<span style="color:' + c + ';">' + lolText[li] + '</span>';
        }
        return '<div style="font-size:0.82rem;padding:2px 0;">' + rainbow + '</div>';

      case 'cmatrix':
        if (args[0] === 'stop' || args[0] === 'exit' || args[0] === 'q') return '';
        return [
          '<div style="font-size:0.5rem;line-height:1.1;color:var(--green);padding:4px 0;font-family:monospace;max-height:120px;overflow:hidden;">',
          '  ' + randomMatrixLine(),
          '  ' + randomMatrixLine(),
          '  ' + randomMatrixLine(),
          '  ' + randomMatrixLine(),
          '  ' + randomMatrixLine(),
          '  ' + randomMatrixLine(),
          '  ' + randomMatrixLine(),
          '  ' + randomMatrixLine(),
          '</div>',
          '<div style="color:var(--text-dim);font-size:0.65rem;">Type <span style="color:var(--cyan);">cmatrix stop</span> to stop</div>'
        ].join('\n');

      case 'curl':
        if (args[0] && args[0].match(/canoglu\.dev|localhost|onurcanoglu/)) {
          return '  HTTP/1.1 200 OK\n  Content-Type: text/html\n  Server: GitHub Pages\n  X-Powered-By: Jekyll\n\n  <html><body><h1>Welcome to Onur Cano\u011flu\'s site!</h1></body></html>';
        }
        return '  curl: (6) Could not resolve host: \'' + (args[0] || '') + '\'';

      case 'ping': {
        var target = args[0] || 'canoglu.dev';
        var lines = [ '  PING ' + target + ' (185.199.108.153) 56(84) bytes of data.' ];
        for (var pi = 0; pi < 3; pi++) {
          var ms = Math.floor(Math.random() * 20 + 5);
          lines.push('  64 bytes from 185.199.108.153: icmp_seq=' + (pi + 1) + ' ttl=59 time=' + ms + '.' + Math.floor(Math.random() * 100) + ' ms');
        }
        lines.push('  --- ' + target + ' ping statistics ---');
        lines.push('  3 packets transmitted, 3 received, 0% packet loss, time 2003ms');
        return lines.join('\n');
      }

      case 'sudo':
        if (args.length === 0) return '  sudo: what?';
        if (args[0] === 'rm' && args.indexOf('-rf') !== -1) return '  Nice try. This system is protected.\n  Event logged and reported.';
        return '  sudo: ' + args.join(' ') + ': command not found\n  (and you\'re not in the sudoers file anyway)';

      case 'exit':
        return '  You can\'t exit. Resistance is futile.\n  Type <span style="color:var(--cyan);">help</span> for available commands.';

      case 'vim':
        return '  <span style="color:var(--text-dim);">Why would you use vim when you have a perfectly good terminal?</span>\n  (jk, <span style="color:var(--green);">vim is love, vim is life</span>)';

      case 'emacs':
        return '  emacs: command not found. <span style="color:var(--text-dim);">(Just kidding, but seriously, use vim.)</span>';

      case 'who':
        return '  onur     console  ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' 12:34\n  onur     ttys000  ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' 12:35';

      case 'df':
        return [
          '  Filesystem                   Size  Used Avail Use% Mounted on',
          '  Kubernetes                   100%  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591  72%  /cluster',
          '  Docker                        50G  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591  48%  /containers',
          '  Terraform                     20G  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591  52%  /infra',
          '  CI/CD                         30G  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591  74%  /pipelines',
          '  Monitoring                    15G  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591  48%  /observability'
        ].join('\n');

      case 'ls':
      case 'll':
        var lsDir = args.length > 0 && !args[0].startsWith('-') ? resolvePath(args[0]) : cwd;
        var listing = listDir(lsDir);
        if (!listing) return '  ls: ' + (args[0] || cwd) + ': No such directory';
        if (args.indexOf('-la') !== -1 || cmd === 'll') {
          var lsLines = [ '  total ' + (listing.files.length + listing.dirs.length) ];
          lsLines.push('  drwxr-xr-x  9 onur  staff  288 May 28 12:34 .');
          lsLines.push('  drwxr-xr-x  3 onur  staff   96 May 28 12:34 ..');
          listing.dirs.forEach(function(d) {
            lsLines.push('  drwxr-xr-x  4 onur  staff  128 May 28 12:34 ' + d.replace('/', ''));
          });
          listing.files.forEach(function(f) {
            lsLines.push('  -rw-r--r--  1 onur  staff  1.2K May 28 12:34 ' + f);
          });
          return lsLines.join('\n');
        }
        var all = listing.dirs.map(function(d) { return d.replace('/', '') + '/'; }).concat(listing.files);
        return '  ' + all.join('  ');

      case 'cat':
        var file = args.join(' ');
        if (!file) return '  cat: missing operand';
        // Check if it contains a path separator
        if (file.indexOf('/') !== -1) {
          var parts = file.split('/');
          var fname = parts.pop();
          var fdir = resolvePath(parts.join('/'));
          var fentries = virtualFS[fdir];
          if (fentries && fentries[fname]) return fentries[fname];
          return '  cat: ' + file + ': No such file or directory';
        }
        var entries = virtualFS[cwd];
        if (entries && entries[file]) return entries[file];
        return '  cat: ' + file + ': No such file or directory';

      default:
        if (cmd.match(/^\.\.\/|^\//)) return '  ' + cmd + ': No such file or directory';
        return '  ' + cmd + ': command not found. Type <span style="color:var(--cyan);">help</span> for available commands.';
    }
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

  // ─── Scroll Animations ─────────────────────────────────────
  var fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length > 0 && 'IntersectionObserver' in window) {
    var fadeObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    fadeEls.forEach(function(el) { fadeObs.observe(el); });
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
