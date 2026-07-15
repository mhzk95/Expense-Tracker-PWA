"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { useReminders } from "@/hooks/useReminders";
import { useResearch } from "@/hooks/useResearch";
import { Bell, CheckCircle2, Clock, AlertTriangle, AlertCircle, Plus, Calendar, X, Link2, Flag, ArrowUpCircle, Trash2 } from "lucide-react";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { AnimatePresence, motion } from "framer-motion";

function isDateOverdue(dateStr?: string) {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  return due.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function isDateToday(dateStr?: string) {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  return due.getDate() === now.getDate() && due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear();
}

function isDateUpcoming(dateStr?: string) {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  // Due tomorrow or later
  return due.getTime() >= new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
}

export default function RemindersPage() {
  const router = useRouter();
  const { reminders, addReminder, updateReminder, deleteReminder } = useReminders();
  const { items: researchItems } = useResearch();
  const [filter, setFilter] = useState<"pending" | "completed">("pending");
  const [newTaskInput, setNewTaskInput] = useState("");
  const [snoozeOpenId, setSnoozeOpenId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesEditValue, setNotesEditValue] = useState("");
  const [notesEditPriority, setNotesEditPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [notesEditDueDate, setNotesEditDueDate] = useState<string>("");

  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>("");
  const [showTaskOptions, setShowTaskOptions] = useState(false);

  const filteredReminders = reminders.filter(r => r.status === filter);

  // Grouping
  const groups = useMemo(() => {
    if (filter === "completed") {
      return { Completed: filteredReminders.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) };
    }
    
    const overdue = filteredReminders.filter(r => isDateOverdue(r.dueDate));
    const today = filteredReminders.filter(r => isDateToday(r.dueDate));
    const upcoming = filteredReminders.filter(r => isDateUpcoming(r.dueDate));
    const someday = filteredReminders.filter(r => !r.dueDate);
    
    // Sort logic by priority
    const sortByPriority = (arr: any[]) => arr.sort((a, b) => {
      const p = { critical: 3, high: 2, medium: 1, low: 0 } as any;
      return (p[b.priority] || 0) - (p[a.priority] || 0);
    });

    return {
      "Overdue": sortByPriority(overdue),
      "Today": sortByPriority(today),
      "Upcoming": sortByPriority(upcoming),
      "Someday": sortByPriority(someday),
    };
  }, [filteredReminders, filter]);

  const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
    if (("key" in e && e.key === "Enter" && newTaskInput.trim()) || ("type" in e && e.type === "click" && newTaskInput.trim())) {
      addReminder({
        id: crypto.randomUUID(),
        title: newTaskInput.trim(),
        priority: newTaskPriority,
        contextTags: [],
        isRecurring: false,
        status: "pending",
        dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : new Date().toISOString(),
      });
      setNewTaskInput("");
      setNewTaskDueDate("");
      setNewTaskPriority("medium");
      setShowTaskOptions(false);
    }
  };

  const handleSnooze = (id: string, preset: "later" | "tomorrow" | "weekend" | "next_week") => {
    const now = new Date();
    let newDate = new Date();
    if (preset === "later") {
      newDate.setHours(now.getHours() + 4);
    } else if (preset === "tomorrow") {
      newDate.setDate(now.getDate() + 1);
      newDate.setHours(9, 0, 0, 0);
    } else if (preset === "weekend") {
      const daysToSaturday = 6 - now.getDay();
      newDate.setDate(now.getDate() + (daysToSaturday >= 0 ? daysToSaturday : 6));
      newDate.setHours(10, 0, 0, 0);
    } else if (preset === "next_week") {
      newDate.setDate(now.getDate() + 7);
      newDate.setHours(9, 0, 0, 0);
    }
    
    updateReminder(id, { dueDate: newDate.toISOString() });
    setSnoozeOpenId(null);
  };

  const handleToggleChecklist = (id: string, notes: string, toggleIndex: number, checked: boolean) => {
    let currentIdx = 0;
    const newNotes = notes.split('\n').map(line => {
       if (line.match(/^(\s*)- \[([ xX])\] (.*)/)) {
         if (currentIdx === toggleIndex) {
            currentIdx++;
            return line.replace(/- \[([ xX])\]/, checked ? '- [x]' : '- [ ]');
         }
         currentIdx++;
       }
       return line;
    }).join('\n');
    updateReminder(id, { notes: newNotes });
  };

  const renderNotes = (id: string, notes: string) => {
    const lines = notes.split('\n');
    let checkboxIndex = 0;
    return lines.map((line, i) => {
      const match = line.match(/^(\s*)- \[([ xX])\] (.*)/);
      if (match) {
        const [, indent, checkedStr, text] = match;
        const checked = checkedStr.toLowerCase() === 'x';
        const currentIndex = checkboxIndex++;
        return (
          <div key={i} className={`flex items-start gap-3 mt-2 ${indent}`}>
            <input 
              type="checkbox" 
              checked={checked} 
              onChange={(e) => handleToggleChecklist(id, notes, currentIndex, e.target.checked)} 
              className="mt-1 h-5 w-5 appearance-none rounded-[6px] border-2 border-[var(--color-border)] bg-[var(--color-surface)] checked:bg-[var(--color-primary)] checked:border-[var(--color-border)] shadow-[1px_1px_0px_0px_var(--color-border)] relative cursor-pointer before:content-[''] before:absolute before:inset-0 before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjIwIDYgOSAxNyA0IDEyIj48L3BvbHlsaW5lPjwvc3ZnPg==')] before:bg-center before:bg-no-repeat before:bg-[length:12px_12px] checked:before:opacity-100 before:opacity-0 transition-all"
            />
            <span className={`text-sm font-bold ${checked ? 'text-gray-400 line-through' : 'text-[var(--color-text)]'}`}>{text}</span>
          </div>
        );
      }
      return <p key={i} className="text-sm font-bold text-gray-700 mt-2 min-h-[1.25rem]">{line}</p>;
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Reminders"
        subtitle={`${filteredReminders.length} ${filter} tasks`}
        action={
          <div className="flex gap-2 bg-gray-100 p-1.5 rounded-[12px] border-[3px] border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)]">
            <button onClick={() => setFilter("pending")} className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all border-[2px] ${filter === "pending" ? "bg-[var(--color-primary)] text-white border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)]" : "text-gray-500 hover:text-[var(--color-text)] border-transparent"}`}>Pending</button>
            <button onClick={() => setFilter("completed")} className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all border-[2px] ${filter === "completed" ? "bg-[var(--color-primary)] text-white border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)]" : "text-gray-500 hover:text-[var(--color-text)] border-transparent"}`}>Completed</button>
          </div>
        }
      />

      {filter === "pending" && (
        <div className="relative mb-8 group space-y-2">
          <div className="relative">
            <Plus className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-[var(--color-text)] stroke-[3px] group-focus-within:text-[var(--color-primary)] transition-colors" />
            <input 
              type="text" 
              value={newTaskInput}
              onChange={e => setNewTaskInput(e.target.value)}
              onKeyDown={handleAddTask}
              onFocus={() => setShowTaskOptions(true)}
              placeholder="Add a new task (Press Enter)..." 
              className="w-full bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[16px] py-4 pl-12 pr-16 shadow-[4px_4px_0px_0px_var(--color-border)] focus:shadow-[6px_6px_0px_0px_var(--color-border)] focus:translate-x-[-2px] focus:translate-y-[-2px] outline-none text-[var(--color-text)] font-bold placeholder-gray-500 transition-all"
            />
            {newTaskInput && (
              <button onClick={handleAddTask} className="absolute right-3 top-1/2 -translate-y-1/2 bg-[var(--color-primary)] border-2 border-[var(--color-border)] hover:bg-violet-500 text-white p-2 rounded-[12px] shadow-[2px_2px_0px_0px_var(--color-border)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                <ArrowUpCircle className="h-5 w-5 stroke-[2.5px]" />
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {showTaskOptions && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap items-center gap-3 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[16px] shadow-[4px_4px_0px_0px_var(--color-border)] p-4 mt-2"
              >
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Calendar className="h-5 w-5 text-[var(--color-text)] stroke-[2.5px] shrink-0" />
                  <input 
                    type="datetime-local" 
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    onClick={(e) => {
                      try {
                        if ('showPicker' in e.currentTarget) e.currentTarget.showPicker();
                      } catch (err) {}
                    }}
                    className="bg-gray-100 border-2 border-[var(--color-border)] font-bold text-[var(--color-text)] text-xs rounded-lg px-3 py-2 w-full cursor-pointer focus:shadow-[2px_2px_0px_0px_var(--color-border)] outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-[var(--color-text)] stroke-[2.5px] shrink-0" />
                  <select 
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="bg-gray-100 border-2 border-[var(--color-border)] font-bold text-[var(--color-text)] text-xs rounded-lg px-3 py-2 outline-none focus:shadow-[2px_2px_0px_0px_var(--color-border)] transition-all"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>
                </div>
                <button onClick={() => setShowTaskOptions(false)} className="p-1.5 hover:bg-gray-200 rounded-lg ml-auto transition-colors border-2 border-transparent hover:border-[var(--color-border)]">
                  <X className="h-5 w-5 text-[var(--color-text)] stroke-[2.5px]" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {filteredReminders.length === 0 && filter === "pending" ? (
        <div className="text-center p-12 bg-[var(--color-surface)] border-4 border-[var(--color-border)] border-dashed rounded-[24px]">
          <div className="h-20 w-20 bg-emerald-100 rounded-[20px] flex items-center justify-center mx-auto mb-6 border-4 border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)]">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 stroke-[3px]" />
          </div>
          <h3 className="text-[var(--color-text)] font-black uppercase tracking-widest text-xl mb-2">Inbox Zero</h3>
          <p className="text-sm font-bold text-gray-500">You have completely cleared your task list.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([groupName, items]) => {
            if (items.length === 0) return null;
            
            const groupColor = groupName === "Overdue" ? "text-red-600 bg-red-100 border-red-600" : 
                               groupName === "Today" ? "text-[var(--color-primary)] bg-violet-100 border-[var(--color-primary)]" : 
                               groupName === "Upcoming" ? "text-blue-600 bg-blue-100 border-blue-600" : 
                               "text-gray-600 bg-gray-100 border-gray-600";

            return (
              <div key={groupName} className="space-y-4">
                {filter === "pending" && (
                  <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[var(--color-text)] mb-3 px-1">
                    <div className={`h-3 w-3 rounded-full border-2 shadow-[1px_1px_0px_0px_var(--color-border)] ${groupColor}`} />
                    {groupName} <span className="text-gray-500 font-bold">({items.length})</span>
                  </h4>
                )}
                
                <AnimatePresence mode="popLayout">
                  {items.map((reminder: any) => (
                    <AnimatedCard key={reminder.id} className="w-full relative group">
                      <div className={`p-4 sm:p-5 flex items-start gap-4 transition-all bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[20px] shadow-[4px_4px_0px_0px_var(--color-border)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--color-border)] active:translate-x-1 active:translate-y-1 active:shadow-none ${
                        reminder.priority === 'critical' ? 'bg-red-50' :
                        reminder.priority === 'high' ? 'bg-orange-50' :
                        ''
                      }`}>
                        <button 
                          onClick={() => updateReminder(reminder.id, { status: reminder.status === 'pending' ? 'completed' : 'pending' })}
                          className={`mt-1 flex-shrink-0 h-7 w-7 rounded-[8px] border-2 border-[var(--color-border)] flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_var(--color-border)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                            reminder.status === 'completed' ? 'bg-emerald-400 text-[var(--color-text)]' : 'bg-[var(--color-surface)] text-transparent hover:bg-gray-100'
                          }`}
                        >
                          <CheckCircle2 className="h-5 w-5 stroke-[3px]" />
                        </button>
                        
                        <div className="flex-1 min-w-0 pr-10 cursor-pointer" onClick={() => setExpandedId(expandedId === reminder.id ? null : reminder.id)}>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className={`font-black text-lg uppercase tracking-wide leading-snug ${reminder.status === 'completed' ? 'text-gray-400 line-through' : 'text-[var(--color-text)]'}`}>
                              {reminder.title}
                            </h3>
                            {reminder.priority === 'critical' && <AlertTriangle className="h-5 w-5 stroke-[2.5px] text-red-500 flex-shrink-0" />}
                            {reminder.priority === 'high' && <AlertCircle className="h-5 w-5 stroke-[2.5px] text-orange-500 flex-shrink-0" />}
                            {reminder.notes && reminder.notes.length > 0 && expandedId !== reminder.id && (
                              <span className="text-[10px] text-[var(--color-text)] font-bold uppercase tracking-widest bg-gray-200 px-2 py-1 rounded-md ml-1 border-2 border-[var(--color-border)] shadow-[1px_1px_0px_0px_var(--color-border)]">Has Notes</span>
                            )}
                          </div>
                          
                          {/* Tags */}
                          {reminder.contextTags && reminder.contextTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {reminder.contextTags.map((tag: string) => (
                                <span key={tag} className="px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-[6px] bg-[var(--color-surface)] text-[var(--color-text)] border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)]">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Contextual Deep Link Mini-Card */}
                          {reminder.linkedItemId && reminder.linkedItemType === "research" && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                const linkedItem = researchItems.find(i => i.id === reminder.linkedItemId);
                                if (linkedItem) {
                                  router.push(`/research?searchQuery=${encodeURIComponent(linkedItem.title || "")}`);
                                } else {
                                  router.push('/research');
                                }
                              }}
                              className="mt-4 p-3 bg-gray-100 border-[3px] border-[var(--color-border)] rounded-xl flex items-center gap-3 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_var(--color-border)] hover:bg-[var(--color-primary)] hover:text-white transition-all group"
                            >
                              <div className="p-2 bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-text)] rounded-lg shrink-0 shadow-[2px_2px_0px_0px_var(--color-border)]">
                                <Link2 className="h-4 w-4 stroke-[2.5px]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] text-gray-500 group-hover:text-white/80 uppercase font-black tracking-widest mb-0.5">Linked Research</p>
                                <p className="text-xs text-[var(--color-text)] group-hover:text-white font-bold truncate">
                                  {researchItems.find(i => i.id === reminder.linkedItemId)?.title || "Unknown Item"}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Expanded Notes Section */}
                          <AnimatePresence>
                            {expandedId === reminder.id && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: "auto" }} 
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mt-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="border-t-[3px] border-[var(--color-border)] pt-4 pb-2">
                                  {editingNotesId === reminder.id ? (
                                    <div className="space-y-4">
                                      <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-100 rounded-[16px] border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)]">
                                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                          <Calendar className="h-5 w-5 text-[var(--color-text)] stroke-[2.5px] shrink-0" />
                                          <input 
                                            type="datetime-local" 
                                            value={notesEditDueDate}
                                            onChange={(e) => setNotesEditDueDate(e.target.value)}
                                            onClick={(e) => {
                                              try {
                                                if ('showPicker' in e.currentTarget) e.currentTarget.showPicker();
                                              } catch (err) {}
                                            }}
                                            className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-text)] font-bold text-xs rounded-lg px-3 py-2 w-full cursor-pointer focus:shadow-[2px_2px_0px_0px_var(--color-border)] outline-none transition-all"
                                          />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Flag className="h-5 w-5 text-[var(--color-text)] stroke-[2.5px] shrink-0" />
                                          <select 
                                            value={notesEditPriority}
                                            onChange={(e) => setNotesEditPriority(e.target.value as any)}
                                            className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-text)] font-bold text-xs rounded-lg px-3 py-2 outline-none focus:shadow-[2px_2px_0px_0px_var(--color-border)] transition-all"
                                          >
                                            <option value="low">Low Priority</option>
                                            <option value="medium">Medium Priority</option>
                                            <option value="high">High Priority</option>
                                            <option value="critical">Critical Priority</option>
                                          </select>
                                        </div>
                                      </div>
                                      <textarea
                                        autoFocus
                                        value={notesEditValue}
                                        onChange={(e) => setNotesEditValue(e.target.value)}
                                        placeholder="- [ ] Subtask 1&#10;- [x] Completed task&#10;Some notes here..."
                                        className="w-full h-32 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[16px] shadow-[4px_4px_0px_0px_var(--color-border)] p-4 text-sm resize-none font-bold outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[6px_6px_0px_0px_var(--color-border)] transition-all"
                                      />
                                      <div className="flex justify-end gap-3 mt-4">
                                        <button 
                                          onClick={() => setEditingNotesId(null)}
                                          className="px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--color-text)] hover:bg-gray-100 rounded-lg transition-colors border-2 border-transparent hover:border-[var(--color-border)]"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          onClick={() => {
                                            updateReminder(reminder.id, { 
                                              notes: notesEditValue,
                                              priority: notesEditPriority,
                                              dueDate: notesEditDueDate ? new Date(notesEditDueDate).toISOString() : reminder.dueDate
                                            });
                                            setEditingNotesId(null);
                                          }}
                                          className="px-4 py-2 bg-[var(--color-primary)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_var(--color-border)] border-2 border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)] text-white text-xs font-black uppercase tracking-widest rounded-lg transition-all"
                                        >
                                          Save All
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                      <div className="group/notes pt-2">
                                        {reminder.notes ? (
                                          <div className="pr-4 pb-2">
                                            {renderNotes(reminder.id, reminder.notes)}
                                          </div>
                                        ) : (
                                          <p className="text-sm font-bold text-gray-500 italic pb-2">No notes or checklists added.</p>
                                        )}
                                        <button 
                                          onClick={() => {
                                            setNotesEditValue(reminder.notes || "");
                                            setNotesEditPriority(reminder.priority || "medium");
                                            
                                            if (reminder.dueDate) {
                                              // Format for datetime-local input (YYYY-MM-DDThh:mm)
                                              const d = new Date(reminder.dueDate);
                                              const tzOffset = d.getTimezoneOffset() * 60000;
                                              const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
                                              setNotesEditDueDate(localISOTime);
                                            } else {
                                              setNotesEditDueDate("");
                                            }
                                            
                                            setEditingNotesId(reminder.id);
                                          }}
                                          className="mt-3 text-xs font-black uppercase tracking-widest text-[var(--color-primary)] hover:text-[var(--color-text)] hover:underline"
                                        >
                                          {reminder.notes ? "Edit Details & Notes" : "+ Add Notes & Details"}
                                        </button>
                                      </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Actions */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {reminder.status === "pending" && (
                            <button 
                              onClick={() => setSnoozeOpenId(snoozeOpenId === reminder.id ? null : reminder.id)}
                              className="p-2 bg-gray-100 border-2 border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-white rounded-[8px] transition-all shadow-[2px_2px_0px_0px_var(--color-border)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                            >
                              <Clock className="h-4 w-4 stroke-[2.5px]" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteReminder(reminder.id); }}
                            className="p-2 bg-gray-100 border-2 border-[var(--color-border)] text-red-600 hover:bg-red-500 hover:text-white rounded-[8px] transition-all shadow-[2px_2px_0px_0px_var(--color-border)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                          >
                            <Trash2 className="h-4 w-4 stroke-[2.5px]" />
                          </button>
                            
                          {snoozeOpenId === reminder.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9, x: 10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                className="absolute right-12 top-0 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)] rounded-[16px] overflow-hidden w-48 z-20"
                              >
                                <div className="p-3 border-b-2 border-[var(--color-border)] flex justify-between items-center bg-gray-100">
                                  <span className="text-[10px] uppercase font-black text-[var(--color-text)] tracking-widest">Snooze</span>
                                  <button onClick={() => setSnoozeOpenId(null)} className="text-[var(--color-text)] hover:text-red-500"><X className="h-4 w-4 stroke-[3px]"/></button>
                                </div>
                                <div className="flex flex-col p-1">
                                  <button onClick={() => handleSnooze(reminder.id, "later")} className="text-left px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--color-text)] hover:bg-gray-100 rounded-lg transition-colors">Later Today</button>
                                  <button onClick={() => handleSnooze(reminder.id, "tomorrow")} className="text-left px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--color-text)] hover:bg-gray-100 rounded-lg transition-colors">Tomorrow</button>
                                  <button onClick={() => handleSnooze(reminder.id, "weekend")} className="text-left px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--color-text)] hover:bg-gray-100 rounded-lg transition-colors">This Weekend</button>
                                  <button onClick={() => handleSnooze(reminder.id, "next_week")} className="text-left px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--color-text)] hover:bg-gray-100 rounded-lg transition-colors">Next Week</button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                      </div>
                    </AnimatedCard>
                  ))}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
