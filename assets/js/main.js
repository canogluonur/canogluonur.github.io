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
  var cmdBuffer = '';
  var cmdHistory = [];
  var histIdx = 0;
  var deployDate = new Date();

  function enableInteractiveMode() {
    interactiveActive = true;
    cmdBuffer = '';
    cmdHistory = [];
    histIdx = 0;

    var term = document.getElementById('terminal');
    if (term) {
      term.addEventListener('keydown', handleTerminalKey);
      term.addEventListener('click', function() { term.focus(); });
      term.focus();
    }
    document.addEventListener('keydown', handleTerminalKey);

    var promptLine = document.querySelector('.terminal-line[data-prompt-only="true"]');
    if (promptLine) {
      var c = promptLine.querySelector('.cursor');
      if (!c) {
        var cs = promptLine.querySelector('.cmd');
        if (cs) cs.innerHTML = '_<span class="cursor"></span>';
      }
    }

    // Clicking anywhere on the page refocuses terminal (unless on a link/button/input)
    document.addEventListener('click', function(e) {
      if (!interactiveActive) return;
      var tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A') return;
      if (e.target.isContentEditable) return;
      var term = document.getElementById('terminal');
      if (term && document.activeElement !== term) term.focus();
    });
  }

  function refocusTerminal() {
    var term = document.getElementById('terminal');
    if (term && document.activeElement !== term) term.focus();
  }

  function handleTerminalKey(e) {
    if (!interactiveActive) return;

    // Only intercept when terminal (or body) is the active element
    var active = document.activeElement;
    if (active && active.id !== 'terminal' && active !== document.body && active.tagName !== 'BODY') return;

    var promptLine = document.querySelector('.terminal-line[data-prompt-only="true"]');
    if (!promptLine) return;
    var cmdSpan = promptLine.querySelector('.cmd');
    if (!cmdSpan) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      cmdSpan.textContent = cmdBuffer;
      promptLine.removeAttribute('data-prompt-only');

      var cmd = cmdBuffer.trim();
      if (cmd) {
        cmdHistory.push(cmd);
        histIdx = cmdHistory.length;
        showCommandOutput(cmd);
      }

      cmdBuffer = '';
      createNewPrompt();
      refocusTerminal();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      cmdBuffer = cmdBuffer.slice(0, -1);
      cmdSpan.innerHTML = cmdBuffer + '_<span class="cursor"></span>';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx > 0) {
        histIdx--;
        cmdBuffer = cmdHistory[histIdx];
        cmdSpan.innerHTML = cmdBuffer + '_<span class="cursor"></span>';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < cmdHistory.length - 1) {
        histIdx++;
        cmdBuffer = cmdHistory[histIdx];
        cmdSpan.innerHTML = cmdBuffer + '_<span class="cursor"></span>';
      } else {
        histIdx = cmdHistory.length;
        cmdBuffer = '';
        cmdSpan.innerHTML = '_<span class="cursor"></span>';
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      clearTerminal();
      refocusTerminal();
    } else if (e.key === 'u' && e.ctrlKey) {
      e.preventDefault();
      cmdBuffer = '';
      cmdSpan.innerHTML = '_<span class="cursor"></span>';
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      cmdBuffer += e.key;
      cmdSpan.innerHTML = cmdBuffer + '_<span class="cursor"></span>';
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

    var pl = document.querySelector('.terminal-line[data-prompt-only="true"]');
    if (pl && pl.parentNode === terminal) {
      terminal.insertBefore(out, pl);
    } else {
      terminal.appendChild(out);
    }
  }

  function createNewPrompt() {
    var terminal = document.getElementById('terminal');
    if (!terminal) return;
    var line = document.createElement('div');
    line.className = 'terminal-line';
    line.setAttribute('data-prompt-only', 'true');
    line.innerHTML = '<span class="prompt">$</span><span class="cmd">_<span class="cursor"></span></span>';
    terminal.appendChild(line);
    line.scrollIntoView({ block: 'end' });
  }

  function clearTerminal() {
    var terminal = document.getElementById('terminal');
    if (!terminal) return;
    terminal.innerHTML = '';
    var line = document.createElement('div');
    line.className = 'terminal-line';
    line.setAttribute('data-prompt-only', 'true');
    line.innerHTML = '<span class="prompt">$</span><span class="cmd">_<span class="cursor"></span></span>';
    terminal.appendChild(line);
  }

  function getUptimeStr() {
    var diff = Math.floor((Date.now() - deployDate.getTime()) / 1000);
    var days = Math.floor(diff / 86400);
    var hours = Math.floor((diff % 86400) / 3600);
    var mins = Math.floor((diff % 3600) / 60);
    return days + 'd ' + hours + 'h ' + mins + 'm';
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
          '  <span style="color:var(--cyan);">cat</span>            Read a file',
          '  <span style="color:var(--cyan);">education</span>      Show education &amp; certs',
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
          '  <span style="color:var(--cyan);">vim</span> / <span style="color:var(--cyan);">emacs</span>   Easter eggs'
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
          '  <div><span style="color:var(--text-dim);">Email:</span> <a href="mailto:onur@canoglu.dev" style="color:var(--cyan);text-decoration:none;border-bottom:1px dashed var(--cyan);">onur@canoglu.dev</a></div>',
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
        return '/home/onur/canogluonur.github.io';

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
        if (args.indexOf('-la') !== -1 || cmd === 'll') {
          return [
            '  total 42',
            '  drwxr-xr-x  9 onur  staff  288 May 28 12:34 .',
            '  drwxr-xr-x  3 onur  staff   96 May 28 12:34 ..',
            '  -rw-r--r--  1 onur  staff  2.1K May 28 12:34 about.txt',
            '  -rw-r--r--  1 onur  staff  1.2K May 28 12:34 skills.txt',
            '  -rw-r--r--  1 onur  staff  1.5K May 28 12:34 contact.md',
            '  drwxr-xr-x  4 onur  staff  128 May 28 12:34 roles',
            '  drwxr-xr-x  3 onur  staff   96 May 28 12:34 projects',
            '  drwxr-xr-x  2 onur  staff   64 May 28 12:34 certs'
          ].join('\n');
        }
        return '  about.txt  skills.txt  contact.md  roles/  projects/  certs/';

      case 'cat':
        var file = args.join(' ');
        if (!file) return '  cat: missing operand';
        if (file.match(/about/)) return 'Cloud-native infrastructure architect. Building scalable, resilient systems with Kubernetes, GitOps, and observability.';
        if (file.match(/skills/)) return 'Kubernetes, Docker, Helm, ArgoCD, Terraform, Ansible, AWS, Azure, Prometheus, Grafana, Elasticsearch, Kibana, Kafka, RabbitMQ, PostgreSQL, MongoDB, Redis, Linux, Vault, GitLab CI, GitHub Actions';
        if (file.match(/contact/)) return 'GitHub: onurcanoglu | LinkedIn: onurcanoglu | Medium: @onurcanoglu | Email: onur@canoglu.dev';
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
