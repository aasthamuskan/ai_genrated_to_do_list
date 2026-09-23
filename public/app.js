'use strict';

const P = {
  high:   { label: 'High',   color: '#f43f5e', bg: 'rgba(244,63,94,0.12)'  },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  low:    { label: 'Low',    color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

function esc(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

function today() { return new Date().toISOString().split('T')[0]; }

function fmtDate(ds) {
  if (!ds) return null;
  const d = new Date(ds + 'T00:00:00'), now = new Date();
  now.setHours(0,0,0,0);
  const diff = Math.ceil((d - now) / 86400000);
  if (diff < 0)  return { t: Math.abs(diff) + 'd overdue', c: 'overdue' };
  if (diff === 0) return { t: 'Today',     c: 'today'    };
  if (diff === 1) return { t: 'Tomorrow',  c: 'tomorrow' };
  if (diff <= 7)  return { t: diff + 'd left', c: 'soon' };
  return { t: d.toLocaleDateString('en-US',{month:'short',day:'numeric'}), c: 'future' };
}

class SmartTodo {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('st-tasks') || 'null') || this._samples();
    this.filter = 'all';
    this.q = '';
    this.editId = null;
    this.genTasks = [];
    this._init();
  }

  // ── LocalStorage ──
  _save() { localStorage.setItem('st-tasks', JSON.stringify(this.tasks)); }

  _samples() {
    const d = (n) => { const x=new Date(); x.setDate(x.getDate()+n); return x.toISOString().split('T')[0]; };
    return [
      {id:'s1',title:'Design landing page mockup',description:'Create wireframes and high-fidelity mockups in Figma',priority:'high',dueDate:d(2),completed:false,createdAt:new Date().toISOString()},
      {id:'s2',title:'Set up CI/CD pipeline',description:'Configure GitHub Actions for automated tests and deployment',priority:'medium',dueDate:d(5),completed:false,createdAt:new Date().toISOString()},
      {id:'s3',title:'Write unit tests for auth module',description:'Cover login, register, and token refresh with Jest',priority:'medium',dueDate:d(-1),completed:false,createdAt:new Date().toISOString()},
      {id:'s4',title:'Update API documentation',description:'Add new endpoints to the Swagger spec',priority:'low',dueDate:d(7),completed:false,createdAt:new Date().toISOString()},
      {id:'s5',title:'Fix Safari login bug',description:'Users on Safari v16+ cannot complete OAuth flow',priority:'high',dueDate:d(-2),completed:false,createdAt:new Date().toISOString()},
      {id:'s6',title:'Refactor database queries',description:'Optimise slow N+1 queries in the orders module',priority:'medium',dueDate:d(10),completed:true,createdAt:new Date().toISOString()},
    ];
  }

  // ── CRUD ──
  addTask(data) {
    const t = {
      id: Date.now().toString(),
      title: data.title.trim(),
      description: (data.description || '').trim(),
      priority: data.priority || 'medium',
      dueDate: data.dueDate || '',
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.unshift(t);
    this._save();
    this.render();
    return t;
  }

  updateTask(id, data) {
    const i = this.tasks.findIndex(t => t.id === id);
    if (i < 0) return;
    this.tasks[i] = { ...this.tasks[i], ...data };
    this._save();
    this.render();
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this._save();
    this.render();
  }

  toggleTask(id) {
    const t = this.tasks.find(t => t.id === id);
    if (!t) return;
    t.completed = !t.completed;
    this._save();
    this.render();
  }

  // ── Filter / Sort ──
  _filtered() {
    let list = [...this.tasks];
    if (this.q) {
      const q = this.q.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    const td = today();
    switch (this.filter) {
      case 'active':    list = list.filter(t => !t.completed); break;
      case 'completed': list = list.filter(t => t.completed); break;
      case 'overdue':   list = list.filter(t => !t.completed && t.dueDate && t.dueDate < td); break;
      case 'high': case 'medium': case 'low':
        list = list.filter(t => t.priority === this.filter); break;
    }
    const po = {high:0,medium:1,low:2};
    list.sort((a,b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (po[a.priority] !== po[b.priority]) return po[a.priority] - po[b.priority];
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return list;
  }

  _stats() {
    const td = today();
    return {
      total:     this.tasks.length,
      active:    this.tasks.filter(t => !t.completed).length,
      completed: this.tasks.filter(t => t.completed).length,
      overdue:   this.tasks.filter(t => !t.completed && t.dueDate && t.dueDate < td).length,
      high:      this.tasks.filter(t => t.priority==='high'   && !t.completed).length,
      medium:    this.tasks.filter(t => t.priority==='medium' && !t.completed).length,
      low:       this.tasks.filter(t => t.priority==='low'    && !t.completed).length,
    };
  }

  // ── Render ──
  render() {
    this._renderStats();
    this._renderTasks();
  }

  _renderStats() {
    const s = this._stats();
    ['total','active','completed','overdue','high','medium','low'].forEach(k => {
      const el = document.getElementById('stat-'+k) || document.getElementById('count-'+k);
      // Stats bar
      const se = document.getElementById('stat-'+k);
      if (se) se.textContent = s[k];
      // Nav counts
      const ce = document.getElementById('count-'+k);
      if (ce) ce.textContent = s[k];
    });
    const pct = s.total ? Math.round((s.completed/s.total)*100) : 0;
    document.getElementById('progress-fill').style.width = pct+'%';
    document.getElementById('progress-pct').textContent = pct+'%';
  }

  _renderTasks() {
    const cont = document.getElementById('tasks-container');
    const empty = document.getElementById('empty-state');
    const list = this._filtered();
    if (!list.length) {
      cont.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    cont.innerHTML = list.map(t => this._taskCard(t)).join('');
    cont.querySelectorAll('.task-cb').forEach(cb => cb.addEventListener('click', e => { e.stopPropagation(); this.toggleTask(cb.dataset.id); }));
    cont.querySelectorAll('.edit-btn').forEach(b  => b.addEventListener('click',  e => { e.stopPropagation(); this.openTaskModal(b.dataset.id); }));
    cont.querySelectorAll('.del-btn').forEach(b   => b.addEventListener('click',  e => { e.stopPropagation(); if(confirm('Delete this task?')) this.deleteTask(b.dataset.id); }));
  }

  _taskCard(t) {
    const p = P[t.priority] || P.medium;
    const di = fmtDate(t.dueDate);
    return `<div class="task-card ${t.completed?'completed':''}" data-id="${t.id}">
      <div class="task-pbar" style="background:${p.color}"></div>
      <div class="task-main">
        <button class="task-cb ${t.completed?'checked':''}" data-id="${t.id}" title="Toggle">
          ${t.completed?'<i class="ri-check-line"></i>':''}
        </button>
        <div class="task-content">
          <div class="task-title ${t.completed?'done':''}">${esc(t.title)}</div>
          ${t.description?`<div class="task-desc">${esc(t.description)}</div>`:''}
        </div>
        <div class="task-meta">
          <span class="pbadge" style="color:${p.color};background:${p.bg}">${p.label}</span>
          ${di?`<span class="dbadge ${di.c}"><i class="ri-calendar-line"></i>${di.t}</span>`:''}
        </div>
        <div class="task-actions">
          <button class="icon-btn edit-btn" data-id="${t.id}" title="Edit"><i class="ri-edit-line"></i></button>
          <button class="icon-btn danger del-btn" data-id="${t.id}" title="Delete"><i class="ri-delete-bin-line"></i></button>
        </div>
      </div>
    </div>`;
  }

  // ── Task Modal ──
  openTaskModal(id = null) {
    this.editId = id;
    const modal = document.getElementById('task-modal');
    document.getElementById('task-form').reset();
    if (id) {
      const t = this.tasks.find(t => t.id === id);
      if (!t) return;
      document.getElementById('modal-title').textContent = 'Edit Task';
      document.getElementById('t-title').value    = t.title;
      document.getElementById('t-desc').value     = t.description;
      document.getElementById('t-priority').value = t.priority;
      document.getElementById('t-due').value      = t.dueDate;
    } else {
      document.getElementById('modal-title').textContent = 'Add New Task';
    }
    modal.classList.add('active');
    setTimeout(() => document.getElementById('t-title').focus(), 80);
  }

  closeTaskModal() {
    document.getElementById('task-modal').classList.remove('active');
    this.editId = null;
  }

  _submitTask() {
    const inp = document.getElementById('t-title');
    const title = inp.value.trim();
    if (!title) {
      inp.classList.add('error');
      inp.focus();
      setTimeout(() => inp.classList.remove('error'), 1500);
      return;
    }
    const data = {
      title,
      description: document.getElementById('t-desc').value,
      priority:    document.getElementById('t-priority').value,
      dueDate:     document.getElementById('t-due').value,
    };
    if (this.editId) this.updateTask(this.editId, data);
    else this.addTask(data);
    this.closeTaskModal();
    this._toast(this.editId ? '✏️ Task updated!' : '✅ Task added!');
  }

  // ── AI Generator ──
  async generateTasks(goal) {
    const btn   = document.getElementById('ai-generate-btn');
    const load  = document.getElementById('ai-loading');
    const res   = document.getElementById('ai-results');
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line spinning"></i> Generating...';
    load.classList.remove('hidden');
    res.classList.add('hidden');
    load.innerHTML = '<div class="bounce-dots"><span></span><span></span><span></span></div><p>AI is analyzing your goal...</p>';

    try {
      const r = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed to generate tasks');
      this.genTasks = data.tasks.map((t, i) => ({ ...t, _id: 'g'+i, _sel: true }));
      this._renderGen();
      res.classList.remove('hidden');
    } catch (err) {
      load.innerHTML = `<div class="ai-error"><i class="ri-error-warning-line"></i> ${esc(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="ri-sparkling-line"></i> Generate Tasks';
    }
  }

  _renderGen() {
    const list = document.getElementById('gen-list');
    list.innerHTML = this.genTasks.map(t => {
      const p = P[t.priority] || P.medium;
      return `<div class="gen-item ${t._sel?'selected':''}" data-gid="${t._id}">
        <input type="checkbox" class="gen-cb" data-gid="${t._id}" ${t._sel?'checked':''}>
        <div class="gen-text">
          <strong>${esc(t.title)}</strong>
          <span>${esc(t.description||'')}</span>
        </div>
        <div class="gen-meta">
          <span class="pbadge" style="color:${p.color};background:${p.bg}">${p.label}</span>
          ${t.dueDate?`<span class="dbadge future"><i class="ri-calendar-line"></i>${t.dueDate}</span>`:''}
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('.gen-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const t = this.genTasks.find(t => t._id === cb.dataset.gid);
        if (t) { t._sel = cb.checked; cb.closest('.gen-item').classList.toggle('selected', cb.checked); }
        this._updateAddBtn();
      });
    });
    this._updateAddBtn();
  }

  _updateAddBtn() {
    const n = this.genTasks.filter(t => t._sel).length;
    const btn = document.getElementById('add-selected-btn');
    btn.textContent = `Add ${n} Task${n!==1?'s':''} to List`;
    btn.disabled = n === 0;
  }

  _addSelected() {
    const sel = this.genTasks.filter(t => t._sel);
    sel.forEach(t => this.addTask({ title:t.title, description:t.description, priority:t.priority, dueDate:t.dueDate }));
    this.closeAIModal();
    this._toast(`✨ Added ${sel.length} AI task${sel.length!==1?'s':''} successfully!`);
  }

  openAIModal() {
    const m = document.getElementById('ai-modal');
    document.getElementById('ai-goal').value = '';
    document.getElementById('ai-results').classList.add('hidden');
    document.getElementById('ai-loading').classList.add('hidden');
    document.getElementById('ai-generate-btn').innerHTML = '<i class="ri-sparkling-line"></i> Generate Tasks';
    m.classList.add('active');
    setTimeout(() => document.getElementById('ai-goal').focus(), 80);
  }

  closeAIModal() {
    document.getElementById('ai-modal').classList.remove('active');
    this.genTasks = [];
  }

  // ── Toast ──
  _toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('active');
    setTimeout(() => t.classList.remove('active'), 3000);
  }

  // ── Init ──
  _init() {
    this.render();

    // Nav
    document.querySelectorAll('.nav-item[data-filter]').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
        this.filter = el.dataset.filter;
        document.getElementById('page-title').textContent = el.dataset.label || 'Tasks';
        this.render();
        // Close sidebar on mobile
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('visible');
      });
    });

    // Search
    const si = document.getElementById('search-input');
    si.addEventListener('input', () => { this.q = si.value; this._renderTasks(); });
    document.getElementById('clear-search').addEventListener('click', () => { si.value=''; this.q=''; this._renderTasks(); });

    // Add task
    document.getElementById('add-task-btn').addEventListener('click', () => this.openTaskModal());
    document.getElementById('fab-add').addEventListener('click', () => this.openTaskModal());

    // Task modal controls
    document.getElementById('modal-close').addEventListener('click',  () => this.closeTaskModal());
    document.getElementById('task-cancel').addEventListener('click',  () => this.closeTaskModal());
    document.getElementById('task-submit').addEventListener('click',  () => this._submitTask());
    document.getElementById('task-modal').addEventListener('click',   e => { if(e.target===e.currentTarget) this.closeTaskModal(); });
    document.getElementById('task-form').addEventListener('keydown',  e => { if(e.key==='Enter' && e.target.tagName!=='TEXTAREA') { e.preventDefault(); this._submitTask(); } });

    // AI modal controls
    document.getElementById('ai-open-btn').addEventListener('click',  () => this.openAIModal());
    document.getElementById('ai-modal-close').addEventListener('click', () => this.closeAIModal());
    document.getElementById('ai-modal').addEventListener('click',     e => { if(e.target===e.currentTarget) this.closeAIModal(); });
    document.getElementById('ai-generate-btn').addEventListener('click', () => {
      const g = document.getElementById('ai-goal').value.trim();
      if (!g) { const el=document.getElementById('ai-goal'); el.classList.add('error'); el.focus(); setTimeout(()=>el.classList.remove('error'),1500); return; }
      this.generateTasks(g);
    });
    document.getElementById('ai-goal').addEventListener('keydown', e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('ai-generate-btn').click(); }});
    document.getElementById('add-selected-btn').addEventListener('click', () => this._addSelected());

    // Hamburger
    document.getElementById('hamburger').addEventListener('click', () => {
      document.getElementById('sidebar').classList.add('open');
      document.getElementById('sidebar-overlay').classList.add('visible');
    });
    document.getElementById('sidebar-close').addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebar-overlay').classList.remove('visible');
    });
    document.getElementById('sidebar-overlay').addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebar-overlay').classList.remove('visible');
    });

    // Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { this.closeTaskModal(); this.closeAIModal(); }
    });
  }
}

const todo = new SmartTodo();
