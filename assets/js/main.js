document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function() {
      nav.classList.toggle('open');
    });
    document.addEventListener('click', function(e) {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('open');
      }
    });
  }

  // Active nav link on scroll
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('nav a');

  function updateActiveNav() {
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
      if (link.getAttribute('href') === '/' + (current ? '#' + current : '')) {
        link.classList.add('active');
      }
    });
  }

  if (sections.length > 0 && navLinks.length > 0) {
    window.addEventListener('scroll', updateActiveNav);
    updateActiveNav();
  }

  // Terminal typing animation
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
        if (index === lines.length - 1) return;
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
});
