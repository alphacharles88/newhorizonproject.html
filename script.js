require.config({
  paths: {
    'vs': 'https://unpkg.com/monaco-editor@0.45.0/min/vs'
  }
});

let editor;
let currentFile = 'index.html';
let openTabs = ['index.html']; // Track open tabs
let files = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Visual Studio Code</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.35/dist/codicon.css">
  <link rel="stylesheet" href="style.css">
  <script src="https://unpkg.com/monaco-editor@0.45.0/min/vs/loader.js"></script>
</head>
<body>
  <div class="window">
    <!-- VS Code UI structure -->
  </div>
  <script src="script.js"></script>
</body>
</html>`,
  'style.css': `/* VS Code Theme Variables */
:root {
  --vscode-editor-background: #1e1e1e;
  --vscode-editor-foreground: #cccccc;
  --vscode-activityBar-background: #333333;
  --vscode-sideBar-background: #252526;
  --vscode-statusBar-background: #007acc;
  --vscode-titleBar-activeBackground: #323233;
}

body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
}`,
  'script.js': `require.config({
  paths: {
    'vs': 'https://unpkg.com/monaco-editor@0.45.0/min/vs'
  }
});

require(['vs/editor/editor.main'], function() {
  // Monaco Editor initialization
});`
};
files['src/app.js'] = '// Nested file sample\nconsole.log("Nested file loaded!");';

let commands = [
  { id: 'workbench.action.files.newUntitledFile', label: 'New File', icon: 'new-file' },
  { id: 'workbench.action.files.openFile', label: 'Open File', icon: 'folder-opened' },
  { id: 'workbench.action.files.save', label: 'Save', icon: 'save' },
  { id: 'workbench.action.showCommands', label: 'Show Command Palette', icon: 'search' },
  { id: 'workbench.action.toggleSidebarVisibility', label: 'Toggle Sidebar', icon: 'layout-sidebar-left' },
  { id: 'workbench.action.togglePanel', label: 'Toggle Panel', icon: 'layout-panel' },
  { id: 'workbench.action.terminal.toggleTerminal', label: 'Toggle Terminal', icon: 'terminal' },
  { id: 'workbench.action.quickOpen', label: 'Go to File', icon: 'go-to-file' },
  { id: 'editor.action.formatDocument', label: 'Format Document', icon: 'whitespace' },
  { id: 'workbench.action.reloadWindow', label: 'Reload Window', icon: 'refresh' },
  { id: 'workbench.action.preferences.colorTheme', label: 'Color Theme', icon: 'color-mode' },
  { id: 'workbench.action.findInFiles', label: 'Find in Files', icon: 'search-view-icon' },
  { id: 'editor.action.commentLine', label: 'Toggle Line Comment', icon: 'comment' },
  { id: 'editor.action.blockComment', label: 'Toggle Block Comment', icon: 'comment-discussion' }
];

require(['vs/editor/editor.main'], function() {
  // Initialize Monaco Editor
  editor = monaco.editor.create(document.getElementById('editor'), {
    value: files[currentFile],
    language: getLanguageFromFile(currentFile),
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    wordWrap: 'on'
  });

  // Update cursor position
  editor.onDidChangeCursorPosition(function(e) {
    document.querySelector('.position').textContent = 'Ln ' + e.position.lineNumber + ', Col ' + e.position.column;
  });

  // Auto-save to localStorage
  editor.onDidChangeModelContent(function() {
    files[currentFile] = editor.getValue();
    localStorage.setItem('vscode-files', JSON.stringify(files));
  });

  // Load from localStorage
  const savedFiles = localStorage.getItem('vscode-files');
  if (savedFiles) {
    Object.assign(files, JSON.parse(savedFiles));
    editor.setValue(files[currentFile]);
  }

  setupIntelliSense();
});

function getLanguageFromFile(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const langMap = {
    'js': 'javascript',
    'ts': 'typescript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust'
  };
  return langMap[ext] || 'plaintext';
}

function initUI() {
  // Activity Bar
  document.querySelectorAll('.activity-bar .icon').forEach(icon => {
    icon.addEventListener('click', function() {
      document.querySelectorAll('.activity-bar .icon').forEach(i => i.classList.remove('active'));
      this.classList.add('active');

      // Handle view switching
      const view = this.dataset.view;
      
      // Hide all sidebars
      document.querySelectorAll('.sidebar').forEach(s => s.style.display = 'none');

      if (view === 'search') {
        document.getElementById('search-sidebar').style.display = 'flex';
      } else if (view === 'extensions') {
        document.getElementById('extensions-sidebar').style.display = 'flex';
      } else if (view === 'settings') {
        openSettings();
        return; // Skip hiding sidebar for editor overlay
      } else {
        document.getElementById('sidebar').style.display = 'flex'; // Default
      }
    });
  });

  // Extensions Action
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('ext-action')) {
      const btn = e.target;
      const extName = btn.closest('.extension-item').querySelector('strong').textContent;
      
      if (btn.textContent === 'Install') {
        btn.textContent = 'Installing...';
        btn.style.background = '#444';
        setTimeout(() => {
          btn.textContent = 'Uninstall';
          btn.style.background = '#e81123';
          showNotification('Installed: ' + extName);
        }, 1000);
      } else {
        btn.textContent = 'Install';
        btn.style.background = '#007acc';
        showNotification('Uninstalled: ' + extName);
      }
    }
  });

  // Sidebar actions
  const newFileIcon = document.querySelector('.sidebar-actions .codicon-new-file');
  if (newFileIcon) {
    newFileIcon.addEventListener('click', function(e) {
      e.stopPropagation();
      newFile();
    });
  }

  // File Explorer (Delegated)
  document.querySelector('.file-tree').addEventListener('click', function(e) {
    const fileItem = e.target.closest('.file-item');
    if (fileItem) {
      const file = fileItem.dataset.file;
      switchToFile(file);
    }
  });

  // Tabs
  document.addEventListener('click', function(e) {
    if (e.target.closest('.tab')) {
      const tab = e.target.closest('.tab');
      if (e.target.classList.contains('codicon-close')) {
        closeTab(tab.dataset.file);
      } else {
        switchToFile(tab.dataset.file);
      }
    }
  });

  // Panel Tabs
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel-view').forEach(v => v.classList.remove('active'));
      this.classList.add('active');
      document.getElementById(this.dataset.panel).classList.add('active');
    });
  });

  // Terminal
  const terminalInput = document.getElementById('terminal-input');
  terminalInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const command = this.value;
      executeCommand(command);
      this.value = '';
    }
  });

  // Command Palette
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      showCommandPalette();
    } else if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveFile();
    } else if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      newFile();
    } else if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      // Switch to search view
      document.querySelector('[data-view="search"]').click();
      document.getElementById('search-input').focus();
    } else if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
    }
  });

  // Search
  document.getElementById('search-button').addEventListener('click', performSearch);
  document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  const replaceBtn = document.getElementById('replace-all-button');
  if (replaceBtn) {
    replaceBtn.addEventListener('click', performReplace);
  }
}

function switchToFile(filename) {
  if (!files[filename] && filename !== 'Settings') {
    files[filename] = ' ';
    updateFileTree(); 
  }
  currentFile = filename;
  
  if (!openTabs.includes(filename)) {
    openTabs.push(filename);
  }

  if (filename === 'Settings') {
    if (document.getElementById('editor')) document.getElementById('editor').style.display = 'none';
    document.getElementById('settings-screen').style.display = 'block';
    hideWelcomeScreen();
  } else {
    if (document.getElementById('editor')) document.getElementById('editor').style.display = 'block';
    document.getElementById('settings-screen').style.display = 'none';
    
    if (editor) {
      editor.setValue(files[filename]);
      const model = monaco.editor.createModel(files[filename], getLanguageFromFile(filename));
      editor.setModel(model);
    }
  }

  // Update tabs
  updateTabs();

  // Update status bar language
  document.querySelector('.language').textContent = getLanguageFromFile(filename).toUpperCase();

  // Hide welcome screen
  hideWelcomeScreen();
}

function updateTabs() {
  const tabsContainer = document.querySelector('.tabs');
  tabsContainer.innerHTML = '';

  openTabs.forEach(file => {
    const tab = document.createElement('div');
    tab.className = 'tab' + (file === currentFile ? ' active' : '');
    tab.dataset.file = file;
    tab.innerHTML = '<span>' + file + '</span><i class="codicon codicon-close"></i>';
    tabsContainer.appendChild(tab);
  });
}

function closeTab(filename) {
  openTabs = openTabs.filter(f => f !== filename);
  
  if (currentFile === filename) {
    if (openTabs.length > 0) {
      currentFile = openTabs[openTabs.length - 1];
      switchToFile(currentFile);
    } else {
      currentFile = '';
      if (editor) editor.setValue('');
      showWelcomeScreen();
    }
  }
  updateTabs();
}

function newFile() {
  const filename = prompt('Enter filename:');
  if (filename && !files[filename]) {
    files[filename] = ' ';
    updateFileTree(); // Refresh sidebar tree
    switchToFile(filename);
  }
}

function saveFile() {
  files[currentFile] = editor.getValue();
  localStorage.setItem('vscode-files', JSON.stringify(files));
  showNotification('File saved successfully!');
}

function executeCommand(command) {
  const output = document.querySelector('.terminal-output');
  output.innerHTML += '<div><span class="prompt">PS C:\\Users\\adeye\\Desktop\\www></span> ' + command + '</div>';

  // Simulate command execution
  setTimeout(() => {
    let result = '';
    const cmdParts = command.trim().split(/\s+/);
    const mainCmd = cmdParts[0];

    if (command === 'ls' || command === 'dir') {
      result = Object.keys(files).map(f => '<div><i class="codicon codicon-file"></i> ' + f + '</div>').join('');
    } else if (command.startsWith('echo ')) {
      result = command.substring(5);
    } else if (command === 'clear') {
      output.innerHTML = '';
      return;
    } else if (command === 'pwd') {
      result = 'C:\\Users\\adeye\\Desktop\\www';
    } else if (mainCmd === 'cat') {
      const filename = cmdParts[1];
      if (files[filename]) {
        result = '<pre style="margin:0; white-space: pre-wrap; font-family: inherit;">' + files[filename].replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
      } else {
        result = 'cat: ' + filename + ': No such file or directory';
      }
    } else if (mainCmd === 'touch') {
      const filename = cmdParts[1];
      if (filename) {
        if (!files[filename]) {
          files[filename] = ' ';
          // trigger redraw of explorer if possible, or just add to keys
          result = 'Created file ' + filename;
        } else {
          result = 'File already exists';
        }
      }
    } else if (mainCmd === 'node') {
      const filename = cmdParts[1];
      if (files[filename]) {
        let outputLog = [];
        const originalLog = console.log;
        console.log = function(...args) {
          const text = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
          outputLog.push(text);
        };
        try {
          eval(files[filename]);
          result = outputLog.map(l => '<div>' + l + '</div>').join('');
          if (!result) result = '<i>Executed ' + filename + ' (no output)</i>';
        } catch (e) {
          result = '<div style="color:#f48771">Error: ' + e.message + '</div>';
        }
        console.log = originalLog;
      } else {
        result = 'node: Cannot find module \'' + filename + '\'';
      }
    } else if (command === 'git status') {
      result = '# On branch main<br>nothing to commit, working tree clean';
    } else if (command.startsWith('npm ')) {
      result = 'npm <span style="color:#4ade80">success</span>';
    } else {
      result = '\'' + command + '\' is not recognized as an internal or external command.';
    }
    output.innerHTML += '<div>' + result + '</div>';
    output.scrollTop = output.scrollHeight;
  }, 100);
}

function showCommandPalette() {
  const palette = document.getElementById('command-palette');
  const input = document.getElementById('command-input');
  const list = document.getElementById('command-list');

  palette.style.display = 'block';
  input.focus();
  input.value = '';

  function updateList(filter = '') {
    list.innerHTML = '';
    const filtered = commands.filter(cmd =>
      cmd.label.toLowerCase().includes(filter.toLowerCase())
    );

    filtered.forEach(cmd => {
      const item = document.createElement('div');
      item.className = 'command-item';
      item.innerHTML = '<i class="codicon codicon-' + cmd.icon + '"></i> ' + cmd.label;
      item.addEventListener('click', () => {
        executeCommandById(cmd.id);
        palette.style.display = 'none';
      });
      list.appendChild(item);
    });
  }

  updateList();

  input.addEventListener('input', function() {
    updateList(this.value);
  });

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      palette.style.display = 'none';
    } else if (e.key === 'Enter') {
      const firstItem = list.querySelector('.command-item');
      if (firstItem) {
        firstItem.click();
      }
    }
  });
}

function executeCommandById(id) {
  switch (id) {
    case 'workbench.action.files.newUntitledFile':
      newFile();
      break;
    case 'workbench.action.files.save':
      saveFile();
      break;
    case 'workbench.action.showCommands':
      showCommandPalette();
      break;
    case 'workbench.action.toggleSidebarVisibility':
      toggleSidebar();
      break;
    case 'workbench.action.togglePanel':
      togglePanel();
      break;
    case 'workbench.action.terminal.toggleTerminal':
      document.querySelector('[data-panel="terminal"]').click();
      break;
    case 'workbench.action.preferences.colorTheme':
      showThemePicker();
      break;
    case 'workbench.action.findInFiles':
      document.querySelector('[data-view="search"]').click();
      document.getElementById('search-input').focus();
      break;
    case 'editor.action.commentLine':
      if (editor) {
        editor.trigger('', 'editor.action.commentLine');
      }
      break;
    case 'editor.action.formatDocument':
      if (editor) {
        editor.trigger('', 'editor.action.formatDocument');
      }
      break;
    default:
      console.log('Command executed:', id);
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
}

function togglePanel() {
  const panel = document.getElementById('bottom-panel');
  panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
}

function performSearch() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const resultsDiv = document.getElementById('search-results');
  resultsDiv.innerHTML = '';

  if (!query) return;

  Object.keys(files).forEach(filename => {
    const content = files[filename];
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(query)) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'search-result';
        resultDiv.innerHTML = '<strong>' + filename + ':' + (index + 1) + '</strong> ' + line.replace(new RegExp(query, 'gi'), '<mark>$&</mark>');
        resultDiv.addEventListener('click', () => {
          switchToFile(filename);
          // Scroll to line (simplified)
          editor.revealLine(index + 1);
          editor.setPosition({ lineNumber: index + 1, column: 1 });
        });
        resultsDiv.appendChild(resultDiv);
      }
    });
  });
}

function showThemePicker() {
  const picker = document.getElementById('theme-picker');
  picker.style.display = 'block';
}

function openFile() {
  // Simulate file open
  alert('File open functionality would be implemented here');
}

function hideWelcomeScreen() {
  document.getElementById('welcome-screen').style.display = 'none';
}

function showWelcomeScreen() {
  document.getElementById('welcome-screen').style.display = 'flex';
}

// Theme switching
document.addEventListener('click', function(e) {
  if (e.target.closest('.theme-item')) {
    const themeItem = e.target.closest('.theme-item');
    const theme = themeItem.dataset.theme;
    switchTheme(theme);
    document.querySelectorAll('.theme-item').forEach(item => item.classList.remove('active'));
    themeItem.classList.add('active');
    document.getElementById('theme-picker').style.display = 'none';
  }
});

function switchTheme(theme) {
  if (editor) {
    monaco.editor.setTheme(theme);
  }
  // Update CSS variables based on theme
  const root = document.documentElement;
  if (theme === 'vs-light') {
    root.style.setProperty('--vscode-editor-background', '#ffffff');
    root.style.setProperty('--vscode-editor-foreground', '#000000');
    root.style.setProperty('--vscode-activityBar-background', '#f3f3f3');
    root.style.setProperty('--vscode-sideBar-background', '#f3f3f3');
    root.style.setProperty('--vscode-statusBar-background', '#007acc');
    root.style.setProperty('--vscode-titleBar-activeBackground', '#dddddd');
    root.style.setProperty('--vscode-tab-activeBackground', '#ffffff');
    root.style.setProperty('--vscode-tab-inactiveBackground', '#f3f3f3');
    root.style.setProperty('--vscode-panel-background', '#ffffff');
  } else if (theme === 'hc-black') {
    root.style.setProperty('--vscode-editor-background', '#000000');
    root.style.setProperty('--vscode-editor-foreground', '#ffffff');
    root.style.setProperty('--vscode-activityBar-background', '#000000');
    root.style.setProperty('--vscode-sideBar-background', '#000000');
    root.style.setProperty('--vscode-statusBar-background', '#ffffff');
    root.style.setProperty('--vscode-titleBar-activeBackground', '#000000');
    root.style.setProperty('--vscode-tab-activeBackground', '#000000');
    root.style.setProperty('--vscode-tab-inactiveBackground', '#000000');
    root.style.setProperty('--vscode-panel-background', '#000000');
  } else {
    // vs-dark
    root.style.setProperty('--vscode-editor-background', '#1e1e1e');
    root.style.setProperty('--vscode-editor-foreground', '#cccccc');
    root.style.setProperty('--vscode-activityBar-background', '#333333');
    root.style.setProperty('--vscode-sideBar-background', '#252526');
    root.style.setProperty('--vscode-statusBar-background', '#007acc');
    root.style.setProperty('--vscode-titleBar-activeBackground', '#323233');
    root.style.setProperty('--vscode-tab-activeBackground', '#1e1e1e');
    root.style.setProperty('--vscode-tab-inactiveBackground', '#2d2d2d');
    root.style.setProperty('--vscode-panel-background', '#1e1e1e');
  }
}

// Enhanced IntelliSense
function setupIntelliSense() {
  const htmlTags = ['h1','h2','h3','h4','h5','h6','p','div','span','a','img','ul','ol','li','table','tr','td','th','form','input','button','nav','header','footer','section','article','aside','script','style','link','meta','main','strong','em','br','hr','label','select','option','textarea','iframe','blockquote','code','pre','canvas'];
  
  const htmlSuggestions = [
    {
      label: '!',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: '<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t$2\n</body>\n</html>',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'HTML5 Boilerplate'
    },
    {
      label: 'vscode-clone',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: '<!DOCTYPE html>\n<html>\n<head>\n\t<title>VS Code Clone</title>\n</head>\n<body>\n\t<h1>Hello World</h1>\n</body>\n</html>',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Basic HTML template for VS Code clone'
    },
    {
      label: 'color',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: 'color: ${1:red};',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'CSS Color Property (inline)'
    }
  ];

  htmlTags.forEach(tag => {
    let insertText = `<${tag}>$1</${tag}>`;
    if (tag === 'img') insertText = '<img src="$1" alt="$2" />';
    else if (tag === 'input') insertText = '<input type="${1:text}" name="$2" value="$3" />';
    else if (tag === 'a') insertText = '<a href="${1:#}">$2</a>';
    else if (tag === 'link') insertText = '<link rel="stylesheet" href="$1" />';
    else if (tag === 'meta') insertText = '<meta name="$1" content="$2" />';
    else if (tag === 'br' || tag === 'hr') insertText = `<${tag} />`;

    htmlSuggestions.push({
      label: tag,
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: insertText,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: `HTML <${tag}> tag`
    });
  });

  // Add custom HTML snippets
  monaco.languages.registerCompletionItemProvider('html', {
    provideCompletionItems: function(model, position) {
      return { suggestions: htmlSuggestions };
    }
  });

  // Add custom CSS snippets
  monaco.languages.registerCompletionItemProvider('css', {
    provideCompletionItems: function(model, position) {
      return {
        suggestions: [
          {
            label: 'color',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'color: ${1:black};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Color property'
          },
          {
            label: 'bgc',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'background-color: ${1:transparent};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Background Color'
          },
          {
            label: 'm',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'margin: ${1:0};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Margin'
          },
          {
            label: 'p',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'padding: ${1:0};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Padding'
          },
          {
            label: 'df',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'display: flex;',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Display Flex'
          }
        ]
      };
    }
  });
}

// Dynamic File Tree Functions
function buildFileTree(files) {
  let tree = {};
  for (let path in files) {
    let parts = path.split('/');
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      let part = parts[i];
      if (i === parts.length - 1) {
        current[part] = { type: 'file', path: path };
      } else {
        if (!current[part]) current[part] = { type: 'folder', children: {} };
        current = current[part].children;
      }
    }
  }
  return tree;
}

function renderFileTree(tree, container) {
  container.innerHTML = '';
  for (let name in tree) {
    let item = tree[name];
    let li = document.createElement('li');
    if (item.type === 'file') {
      li.className = 'file-item';
      li.dataset.file = item.path;
      li.innerHTML = '<i class="codicon codicon-file"></i> ' + name;
    } else {
      li.className = 'folder-item';
      li.innerHTML = '<div class="folder-header"><i class="codicon codicon-chevron-right"></i> <i class="codicon codicon-folder"></i> ' + name + '</div><ul class="folder-children" style="display:none"></ul>';
      renderFileTree(item.children, li.querySelector('.folder-children'));
      li.querySelector('.folder-header').addEventListener('click', function(e) {
        e.stopPropagation();
        const children = li.querySelector('.folder-children');
        const icon = li.querySelector('.codicon-chevron-right');
        if (children.style.display === 'none') {
          children.style.display = 'block';
          icon.classList.replace('codicon-chevron-right', 'codicon-chevron-down');
        } else {
          children.style.display = 'none';
          icon.classList.replace('codicon-chevron-down', 'codicon-chevron-right');
        }
      });
    }
    container.appendChild(li);
  }
}

function updateFileTree() {
  const tree = buildFileTree(files);
  renderFileTree(tree, document.querySelector('.file-tree'));
}

function performReplace() {
  const query = document.getElementById('search-input').value;
  const replaceText = document.getElementById('replace-input').value;
  if (!query) return;

  const regex = new RegExp(query, 'gi');
  let replaceCount = 0;

  Object.keys(files).forEach(filename => {
    const content = files[filename];
    if (content.match(regex)) {
      const newContent = content.replace(regex, replaceText);
      files[filename] = newContent;
      replaceCount++;
      if (filename === currentFile && editor) {
        editor.setValue(newContent);
      }
    }
  });
  showNotification('Replaced in ' + replaceCount + ' files.');
  performSearch(); // Refresh search view
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function openSettings() {
  if (!openTabs.includes('Settings')) {
    openTabs.push('Settings');
  }
  switchToFile('Settings');
}

// Settings listeners
document.addEventListener('DOMContentLoaded', function() {
  const fontSizeInput = document.getElementById('settings-font-size');
  if (fontSizeInput) {
    fontSizeInput.addEventListener('input', function() {
      if (editor) editor.updateOptions({ fontSize: Number(this.value) });
    });
  }
  const tabSizeInput = document.getElementById('settings-tab-size');
  if (tabSizeInput) {
    tabSizeInput.addEventListener('input', function() {
      if (editor) editor.updateOptions({ tabSize: Number(this.value) });
    });
  }
  const wordWrapCheck = document.getElementById('settings-word-wrap');
  if (wordWrapCheck) {
    wordWrapCheck.addEventListener('change', function() {
      if (editor) editor.updateOptions({ wordWrap: this.checked ? 'on' : 'off' });
    });
  }
});

// Initialize welcome screen
document.addEventListener('DOMContentLoaded', function() {
  initUI();
  updateFileTree();
  showWelcomeScreen();
});
