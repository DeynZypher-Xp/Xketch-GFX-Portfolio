"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Code2,
  FileText,
  Search,
  Terminal,
  BookOpen,
  Sparkles,
} from "lucide-react";

interface ExperimentNote {
  id: number;
  number: string;
  title: string;
  topic: string;
  description: string[];
  code: string;
  output: string;
}

const EXPERIMENTS: ExperimentNote[] = [
  {
    id: 1,
    number: "Experiment 1",
    title:
      "Develop a program for a temperature alert system that triggers warnings when temperature exceeds a threshold using the random module for simulated input.",
    topic: "Random & Conditional Alerts",
    description: [
      "The random module is used to generate a simulated temperature between 20°C and 45°C.",
      "The program compares the generated temperature against a threshold value of 35°C.",
      "If the temperature is greater than the threshold, it displays a warning message.",
      "Otherwise, it displays that the temperature is normal.",
    ],
    code: `import random

# Set the temperature threshold 
threshold = 35

# Generate a random temperature between 20 and 45 
temperature = random.randint(20, 45)
print("Current Temperature:", temperature, "°C") 

# Check if temperature exceeds the threshold
if temperature > threshold:
    print("Warning! High Temperature Alert!")
else:
    print("Temperature is Normal.")`,
    output: `Current Temperature: 43 °C
Warning! High Temperature Alert!

Current Temperature: 23 °C
Temperature is Normal.`,
  },
  {
    id: 2,
    number: "Experiment 2",
    title:
      "Develop a traffic signal control system using conditional statements and loops.",
    topic: "Loops & Conditional Logic",
    description: [
      "Controls the movement of vehicles by displaying different traffic signals (Red, Yellow, Green).",
      "Uses conditional statements (if, elif, else) to decide the appropriate action for each signal.",
      "Uses a for-loop (range 3) to repeat the signal inspection process.",
    ],
    code: `# Traffic Signal Control System
for i in range(3):
    signal = input("Enter Signal (Red/Yellow/Green): ") 
    if signal == "Red":
        print("STOP")
    elif signal == "Yellow":
        print("GET READY")
    elif signal == "Green": 
        print("GO")
    else:
        print("Invalid Signal")

print("Traffic Signal System Ended")`,
    output: `Enter Signal (Red/Yellow/Green): Red
STOP
Enter Signal (Red/Yellow/Green): Yellow
GET READY
Enter Signal (Red/Yellow/Green): Green
GO
Traffic Signal System Ended`,
  },
  {
    id: 3,
    number: "Experiment 3",
    title:
      "Develop a Python program using functions to simulate a simple ATM banking system.",
    topic: "Functions & Interactive Menu",
    description: [
      "Maintains an initial account balance of ₹5,000.",
      "Option 1: Check Balance – displays current balance.",
      "Option 2: Deposit Money – accepts deposit amount and updates balance.",
      "Option 3: Withdraw Money – checks balance and withdraws only if funds are sufficient, otherwise alerts 'Insufficient Balance'.",
      "Option 4: Exit – terminates the ATM loop.",
      "Implements modular functions for check_balance, deposit, and withdraw.",
    ],
    code: `def check_balance(balance):
    print("Current Balance = ₹", balance)

def deposit(balance, amount):
    balance = balance + amount
    return balance

def withdraw(balance, amount):
    if amount <= balance:
        balance = balance - amount
        return balance
    else:
        print("Insufficient Balance")
        return balance

balance = 5000

while True:
    print("\\n--- ATM MENU ---")
    print("1. Check Balance")
    print("2. Deposit")
    print("3. Withdraw")
    print("4. Exit")
    choice = int(input("Enter your choice: "))

    if choice == 1:
        check_balance(balance)
    elif choice == 2:
        amount = float(input("Enter deposit amount: "))
        balance = deposit(balance, amount)
        print("Amount deposited successfully.")
    elif choice == 3:
        amount = float(input("Enter withdrawal amount: "))
        balance = withdraw(balance, amount)
    elif choice == 4:
        print("Thank you!")
        break
    else:
        print("Invalid choice")`,
    output: `--- ATM MENU ---
1. Check Balance
2. Deposit
3. Withdraw
4. Exit
Enter your choice: 1
Current Balance = ₹ 5000

--- ATM MENU ---
1. Check Balance
2. Deposit
3. Withdraw
4. Exit
Enter your choice: 2
Enter deposit amount: 2000
Amount deposited successfully.

--- ATM MENU ---
1. Check Balance
2. Deposit
3. Withdraw
4. Exit
Enter your choice: 1
Current Balance = ₹ 7000`,
  },
  {
    id: 4,
    number: "Experiment 4",
    title:
      "A company is designing an online feedback system for homestay bookings. Develop a menu-driven Python program using string methods.",
    topic: "String Manipulation & Methods",
    description: [
      "Raw string: ' moonlight homestay is amazing amazing place to relax '",
      "i. Remove extra spaces at beginning and end (strip).",
      "ii. Replace duplicate word 'amazing amazing' with single 'amazing'.",
      "iii. Capitalize the first letter of each word properly (title).",
      "iv. Count the number of vowels in the cleaned string.",
      "v. Find the position of the word 'relax'.",
      "vi. Join the cleaned words with '-' as a separator.",
    ],
    code: `# Feedback Text Processing System
feedback = " moonlight homestay is amazing amazing place to relax "

# i. Remove extra spaces
def remove_spaces(text):
    text = text.strip()
    print("After removing extra spaces:")
    print(text)

# ii. Remove duplicate word
def remove_duplicate(text):
    text = text.replace("amazing amazing", "amazing")
    print("After removing duplicate word:")
    print(text)

# iii. Capitalize the first letter of each word
def capitalize_words(text):
    text = text.title()
    print("After capitalization:")
    print(text)

# iv. Count vowels
def count_vowels(text):
    count = 0
    for ch in text.lower():
        if ch in "aeiou":
            count += 1
    print("Number of vowels:", count)

# v. Find the position of the word "Relax"
def find_word_position(text):
    words = text.split()
    if "Relax" in words:
        position = words.index("Relax") + 1
        print("Position of 'Relax':", position)
    elif "relax" in words:
        position = words.index("relax") + 1
        print("Position of 'Relax':", position)
    else:
        print("'Relax' not found.")

# vi. Join the cleaned words using '-'
def join_words(text):
    words = text.split()
    print("Words joined using '-':")
    print("-".join(words))

# Menu-driven program
while True:
    print("\\n--- Feedback Processing Menu ---")
    print("1. Remove extra spaces")
    print("2. Remove duplicate word")
    print("3. Capitalize each word")
    print("4. Count vowels")
    print("5. Find position of 'Relax'")
    print("6. Join words using '-'")
    print("7. Exit")

    choice = int(input("Enter your choice: "))

    if choice == 1:
        remove_spaces(feedback)
    elif choice == 2:
        remove_duplicate(feedback)
    elif choice == 3:
        capitalize_words(feedback)
    elif choice == 4:
        count_vowels(feedback)
    elif choice == 5:
        find_word_position(feedback)
    elif choice == 6:
        join_words(feedback)
    elif choice == 7:
        print("Program terminated.")
        break
    else:
        print("Invalid choice.")`,
    output: `--- Feedback Processing Menu ---
1. Remove extra spaces
2. Remove duplicate word
3. Capitalize each word
4. Count vowels
5. Find position of 'Relax'
6. Join words using '-'
7. Exit
Enter your choice: 1
After removing extra spaces:
moonlight homestay is amazing amazing place to relax`,
  },
  {
    id: 5,
    number: "Experiment 5",
    title:
      "Create a log file analyser to detect errors and generate reports using re for pattern matching.",
    topic: "File I/O & Regular Expressions",
    description: [
      "Creates a mock log file 'log.txt' with INFO and ERROR entries.",
      "Reads the log file line-by-line using Python file handling.",
      "Utilizes regular expressions (re.search) to filter out lines containing 'ERROR'.",
      "Calculates and prints the total number of errors detected in a structured report.",
    ],
    code: `with open("log.txt", "w") as file:
    file.write("""INFO: System Started
ERROR: File Not Found
INFO: User Logged In
ERROR: Network Connection Failed
INFO: Process Completed
""")

import re

file = open("log.txt", "r")

error_count = 0

print("Error Report")
print("----------------------")

for line in file:
    if re.search("ERROR", line):
        print(line.strip())
        error_count += 1

file.close()

print("----------------------")
print("Total Errors =", error_count)`,
    output: `Error Report
----------------------
ERROR: File Not Found
ERROR: Network Connection Failed
----------------------
Total Errors = 2`,
  },
  {
    id: 6,
    number: "Experiment 6",
    title:
      "Develop a shopping cart application using lists and dictionaries to add, remove, update items, and calculate total bill with discounts.",
    topic: "Lists, Dictionaries & Calculations",
    description: [
      "Uses a List ('cart') containing dictionaries with keys 'Name' and 'Price'.",
      "1. Add Item: Appends a new item dictionary to the cart list.",
      "2. Remove Item: Searches and removes specified item by name.",
      "3. Update Item: Finds existing item and modifies its price.",
      "4. Show Bill: Calculates gross total and applies 10% discount if total exceeds ₹500.",
      "5. Exit: Quits the shopping cart application.",
    ],
    code: `cart = []  # Empty List

while True:
    print("\\n------ Shopping Cart ------")
    print("1. Add Item")
    print("2. Remove Item")
    print("3. Update Item")
    print("4. Show Bill")
    print("5. Exit")

    choice = int(input("Enter your choice: "))

    # Add Item
    if choice == 1:
        name = input("Enter Item Name: ")
        price = float(input("Enter Item Price: "))
        item = {
            "Name": name,
            "Price": price
        }
        cart.append(item)
        print("Item Added Successfully!")

    # Remove Item
    elif choice == 2:
        name = input("Enter Item Name to Remove: ")
        for item in cart:
            if item["Name"] == name:
                cart.remove(item)
                print("Item Removed Successfully!")
                break
        else:
            print("Item Not Found!")

    # Update Item
    elif choice == 3:
        name = input("Enter Item Name to Update: ")
        for item in cart:
            if item["Name"] == name:
                new_price = float(input("Enter New Price: "))
                item["Price"] = new_price
                print("Item Updated Successfully!")
                break
        else:
            print("Item Not Found!")

    # Show Bill
    elif choice == 4:
        total = 0
        print("\\nItems in Cart")
        for item in cart:
            print(item["Name"], "-", item["Price"])
            total = total + item["Price"]

        print("\\nTotal Bill =", total)
        if total >= 500:
            discount = total * 0.10
            total = total - discount
            print("Discount (10%) =", discount)
            print("Final Bill =", total)

    # Exit
    elif choice == 5:
        print("Thank You!")
        break

    # Invalid choice
    else:
        print("Invalid Choice")`,
    output: `------ Shopping Cart ------
1. Add Item
2. Remove Item
3. Update Item
4. Show Bill
5. Exit
Enter your choice: 1
Enter Item Name: Pen
Enter Item Price: 20
Item Added Successfully!

------ Shopping Cart ------
1. Add Item
2. Remove Item
3. Update Item
4. Show Bill
5. Exit
Enter your choice: 1
Enter Item Name: Book
Enter Item Price: 600
Item Added Successfully!

------ Shopping Cart ------
1. Add Item
2. Remove Item
3. Update Item
4. Show Bill
5. Exit
Enter your choice: 4

Items in Cart
Pen - 20.0
Book - 600.0

Total Bill = 620.0
Discount (10%) = 62.0
Final Bill = 558.0`,
  },
];

export default function NotesSection() {
  const [selectedExpId, setSelectedExpId] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (text: string, key: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy note:", err);
    }
  };

  const filteredExperiments = EXPERIMENTS.filter((exp) => {
    const matchesFilter =
      selectedExpId === "all" || exp.id === selectedExpId;
    const matchesSearch =
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <section id="notes" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs sm:text-sm font-semibold tracking-wide uppercase mb-3">
            <BookOpen className="w-4 h-4" />
            <span>Python Lab Manual &bull; Experiments 1 to 6</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            Code <span className="text-purple-400">Notes &amp; Programs</span>
          </h2>
          <p className="text-zinc-400 mt-2 text-sm sm:text-base max-w-2xl">
            Complete Python laboratory experiments with headings, objectives,
            verified source code, and expected outputs. Click{" "}
            <span className="text-purple-300 font-medium">Copy Code</span> to
            copy any experiment instantly.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search experiments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500 transition"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        <button
          onClick={() => setSelectedExpId("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
            selectedExpId === "all"
              ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              : "bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          All Experiments (6)
        </button>
        {EXPERIMENTS.map((exp) => (
          <button
            key={exp.id}
            onClick={() => setSelectedExpId(exp.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${
              selectedExpId === exp.id
                ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                : "bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>Exp {exp.id}</span>
          </button>
        ))}
      </div>

      {/* Experiments List */}
      <div className="space-y-8">
        {filteredExperiments.length === 0 ? (
          <div className="rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 p-12 text-center text-zinc-400">
            No experiments found matching &quot;{searchQuery}&quot;. Try a different search term.
          </div>
        ) : (
          filteredExperiments.map((exp) => {
            const isCodeCopied = copiedKey === `code-${exp.id}`;
            const isFullCopied = copiedKey === `full-${exp.id}`;

            const fullNoteText = `${exp.number}
${exp.title}

In this program:
${exp.description.map((d) => `• ${d}`).join("\n")}

Code:
${exp.code}

Output:
${exp.output}`;

            return (
              <div
                key={exp.id}
                className="rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 overflow-hidden hover:border-purple-500/50 transition duration-300 shadow-xl"
              >
                {/* Card Header */}
                <div className="p-6 sm:p-8 border-b border-white/10 bg-white/[0.02]">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs sm:text-sm font-bold tracking-wider uppercase border border-purple-500/30">
                        {exp.number}
                      </span>
                      <span className="text-xs sm:text-sm text-zinc-400 font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        {exp.topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Copy Entire Note Button */}
                      <button
                        onClick={() => handleCopy(fullNoteText, `full-${exp.id}`)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-purple-500/20 hover:border-purple-500/40 text-xs text-zinc-300 hover:text-white transition flex items-center gap-1.5"
                        title="Copy note heading, description, code, and output"
                      >
                        {isFullCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400 font-medium">Full Note Copied!</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5 text-purple-400" />
                            <span>Copy Full Note</span>
                          </>
                        )}
                      </button>

                      {/* Quick Copy Code Button */}
                      <button
                        onClick={() => handleCopy(exp.code, `code-${exp.id}`)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                          isCodeCopied
                            ? "bg-green-500/20 text-green-400 border border-green-500/40"
                            : "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                        }`}
                        title="Copy Python source code"
                      >
                        {isCodeCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            <span>Copied Code!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-snug">
                    {exp.title}
                  </h3>

                  {/* Bullet points */}
                  <div className="mt-4 space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-purple-400/90">
                      Overview &amp; Implementation Details:
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {exp.description.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs sm:text-sm text-zinc-300"
                        >
                          <span className="text-purple-400 mt-0.5 font-bold">&bull;</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Code Window */}
                <div className="bg-[#0b0b12] border-b border-white/10">
                  <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-white/[0.03] border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 mr-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70 inline-block" />
                      </div>
                      <Code2 className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-mono text-zinc-400">
                        exp_{exp.id}.py
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-zinc-500">
                        Python 3
                      </span>
                      <button
                        onClick={() => handleCopy(exp.code, `code-${exp.id}`)}
                        className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition"
                      >
                        {isCodeCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 overflow-x-auto text-xs sm:text-sm font-mono text-zinc-200 leading-relaxed selection:bg-purple-500 selection:text-white">
                    <pre>
                      <code>{exp.code}</code>
                    </pre>
                  </div>
                </div>

                {/* Output Window */}
                <div className="p-4 sm:p-6 bg-black/40">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    <span>Sample Output</span>
                  </div>
                  <pre className="p-3 sm:p-4 rounded-xl bg-black/60 border border-white/5 font-mono text-xs sm:text-sm text-emerald-400/90 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {exp.output}
                  </pre>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
