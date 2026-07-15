import re

file_path = "/Users/evalogical/Projects/Evalogical/eva_tasks/Pwa/expense-tracker/components/transactions/TransactionForm.tsx"

with open(file_path, "r") as f:
    content = f.read()

# 1. Focus styles
content = re.sub(
    r'const focusStyles = \{[\s\S]*?\};',
    '''const focusStyles = {
    expense: "focus:shadow-[4px_4px_0px_0px_#000] focus:-translate-y-0.5",
    income: "focus:shadow-[4px_4px_0px_0px_#000] focus:-translate-y-0.5",
    transfer: "focus:shadow-[4px_4px_0px_0px_#000] focus:-translate-y-0.5",
  };''',
    content
)

# 2. Main Details Card
content = content.replace(
    'className="relative z-30 p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-4 backdrop-blur-md"',
    'className="relative z-30 p-4 bg-white border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_#000] space-y-4"'
)

# 3. Type Toggle
content = content.replace(
    'className="flex p-1 bg-slate-950 rounded-xl border border-slate-800/60"',
    'className="flex p-1 bg-gray-100 rounded-xl border-2 border-black shadow-inner"'
)
content = content.replace(
    't === "expense" ? "bg-red-500/20 text-red-400 border border-red-500/30" :',
    't === "expense" ? "bg-red-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]" :'
)
content = content.replace(
    't === "income" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :',
    't === "income" ? "bg-emerald-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]" :'
)
content = content.replace(
    '"bg-blue-500/20 text-blue-400 border border-blue-500/30"',
    '"bg-blue-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]"'
)
content = content.replace(
    'text-slate-400 hover:text-slate-200',
    'text-gray-500 hover:text-black border-2 border-transparent'
)
content = content.replace(
    'className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all active:scale-[0.98] ${',
    'className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${'
)

# 4. Amount field labels
content = content.replace(
    'text-[10px] font-semibold text-slate-400 uppercase tracking-wider',
    'text-[10px] font-black text-black uppercase tracking-widest'
)
content = content.replace(
    'text-[10px] text-emerald-400 font-semibold truncate animate-pulse bg-emerald-500/10 px-1.5 py-0.5 rounded',
    'text-[10px] text-black font-black truncate bg-emerald-300 px-2 py-0.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]'
)
content = content.replace(
    'text-[10px] text-violet-400 font-semibold cursor-pointer hover:text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-lg border border-violet-500/20',
    'text-[10px] text-white font-black cursor-pointer bg-[var(--color-primary)] px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all uppercase tracking-widest'
)
content = content.replace(
    'className="w-2.5 h-2.5 animate-spin"',
    'className="w-3 h-3 animate-spin stroke-[3px]"'
)
content = content.replace(
    'className="w-2.5 h-2.5"',
    'className="w-3 h-3 stroke-[3px]"'
)

# 5. Amount Input
content = content.replace(
    'text-slate-500 text-lg font-semibold',
    'text-black text-xl font-black'
)
content = content.replace(
    'bg-slate-950/40 border border-slate-800/80 rounded-xl pl-9 pr-4 py-3 text-lg font-bold text-white transition-all shadow-inner outline-none',
    'bg-white border-2 border-black rounded-xl pl-9 pr-4 py-3 text-2xl font-black text-black transition-all outline-none'
)

# Quick add buttons
content = content.replace(
    'text-[10px] font-bold bg-slate-900 border border-slate-800/80 rounded-lg text-slate-400 hover:text-white transition-all active:scale-95',
    'text-[10px] font-black bg-white border-2 border-black rounded-lg text-black hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none'
)
content = content.replace(
    'text-[10px] font-bold bg-slate-900 border border-slate-800/80 rounded-lg text-red-400 hover:text-red-300 transition-all active:scale-95 ml-auto',
    'text-[10px] font-black bg-red-400 border-2 border-black rounded-lg text-black hover:bg-red-500 transition-all shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none ml-auto'
)

# Keypad Panel
content = content.replace(
    'bg-slate-950/90 border border-slate-800/60 rounded-2xl p-3 space-y-2 mt-3 shadow-2xl relative z-40',
    'bg-white border-[3px] border-black rounded-[24px] p-3 space-y-2 mt-3 shadow-[8px_8px_0px_0px_#000] relative z-40'
)
# Keypad buttons styling - we will do a regex for common button classes
content = re.sub(
    r'className="h-10 rounded-xl bg-[^"]+ text-[^"]+ transition-all active:scale-95([^"]*)"',
    r'className="h-10 rounded-xl bg-white border-2 border-black text-black font-black hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none\1"',
    content
)
content = re.sub(
    r'className="col-span-2 h-10 rounded-xl bg-[^"]+ text-[^"]+ transition-all active:scale-95"',
    r'className="col-span-2 h-10 rounded-xl bg-emerald-400 border-2 border-black text-black font-black hover:bg-emerald-500 transition-all shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"',
    content
)

# General Inputs
content = content.replace(
    'bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-2.5 text-xs text-white transition-all shadow-inner outline-none',
    'bg-white border-2 border-black rounded-xl px-3 py-2.5 text-xs text-black font-bold transition-all outline-none'
)
content = content.replace(
    'bg-slate-950/40 border border-slate-800/80 rounded-xl pl-3 pr-8 py-2.5 text-xs text-white transition-all shadow-inner outline-none',
    'bg-white border-2 border-black rounded-xl pl-3 pr-8 py-2.5 text-xs text-black font-bold transition-all outline-none'
)

# Optional details container
content = content.replace(
    'bg-slate-900/20 border border-white/5 rounded-2xl p-3 space-y-4',
    'bg-gray-100 border-[3px] border-black rounded-[16px] p-4 space-y-4 shadow-inner'
)

# Select Placeholders
content = content.replace(
    '<span className="text-slate-500 text-xs">Select...</span>',
    '<span className="text-gray-500 text-xs font-bold">Select...</span>'
)
content = content.replace(
    'text-xs font-semibold truncate',
    'text-xs font-black truncate text-black'
)

# Hide optional details button
content = content.replace(
    'className="w-full py-2.5 px-4 rounded-xl border border-slate-800/80 bg-slate-950/20 text-slate-400 hover:text-white transition-all text-xs font-semibold flex items-center justify-between hover:bg-slate-900/20 active:scale-[0.99]"',
    'className="w-full py-3 px-4 rounded-xl border-[3px] border-black bg-gray-100 text-black font-black uppercase tracking-widest transition-all text-xs flex items-center justify-between hover:bg-gray-200 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:translate-x-1 active:shadow-none"'
)

# Optional details inner card
content = content.replace(
    'className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-4 backdrop-blur-md"',
    'className="p-4 bg-white border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_#000] space-y-4"'
)

# Needs Review
content = content.replace(
    'className="relative z-10 flex items-center justify-between p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 backdrop-blur-md"',
    'className="relative z-10 flex items-center justify-between p-4 bg-gray-50 rounded-[16px] border-[3px] border-black"'
)
content = content.replace(
    'text-xs font-semibold text-amber-500 uppercase tracking-wider',
    'text-[10px] font-black text-black uppercase tracking-widest'
)
content = content.replace(
    'text-[10px] text-amber-500/70 mt-0.5 leading-tight',
    'text-[10px] font-bold text-gray-500 mt-0.5 leading-tight uppercase tracking-wider'
)
content = content.replace(
    'border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${needsReview ? \'bg-amber-500\' : \'bg-slate-700\'}',
    'border-2 border-black transition-colors duration-200 ease-in-out focus:outline-none ${needsReview ? \'bg-amber-400\' : \'bg-gray-300\'}'
)
content = content.replace(
    'bg-white shadow ring-0 transition duration-200 ease-in-out',
    'bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] ring-0 transition duration-200 ease-in-out'
)

# Submit button area
content = content.replace(
    'className="absolute bottom-0 inset-x-0 p-4 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-md flex-shrink-0 z-20"',
    'className="absolute bottom-0 inset-x-0 p-4 bg-white border-t-[3px] border-black flex-shrink-0 z-20"'
)

content = content.replace(
    'className={`w-full py-3.5 font-semibold text-sm rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] ${',
    'className={`w-full py-4 font-black uppercase tracking-widest text-sm rounded-xl border-[3px] border-black transition-all disabled:opacity-50 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:translate-x-1 active:shadow-none ${'
)
content = content.replace(
    'bg-red-600 hover:bg-red-500 hover:shadow-red-500/20 text-white shadow-lg shadow-red-600/10',
    'bg-red-400 hover:bg-red-500 text-black'
)
content = content.replace(
    'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20 text-white shadow-lg shadow-emerald-600/10',
    'bg-emerald-400 hover:bg-emerald-500 text-black'
)
content = content.replace(
    'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/20 text-white shadow-lg shadow-blue-600/10',
    'bg-[var(--color-primary)] hover:bg-violet-500 text-white'
)

# Location button
content = content.replace(
    'bg-slate-950/40 border border-slate-800/80 text-slate-400 hover:bg-slate-900/40 hover:text-white',
    'bg-white border-2 border-black text-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none'
)
content = content.replace(
    'text-violet-400',
    'text-[var(--color-primary)] stroke-[3px]'
)

with open(file_path, "w") as f:
    f.write(content)
