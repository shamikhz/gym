/* ==========================================================================
   Star Gym - Gym Management System Application Logic
   ========================================================================== */

// --- Supabase Database Integration Config ---
// To connect to a live Supabase database, paste your project keys below.
// If left blank, the system will quietly run in offline mode using LocalStorage.
const SUPABASE_URL = ""; 
const SUPABASE_KEY = ""; 

// --- Global Application State ---
let dbState = {
  isSupabase: false,
  supabaseClient: null,
  members: [],
  logs: []
};

// --- Mock Seed Data (for Offline Demo Mode) ---
const INITIAL_SEED_MEMBERS = [
  {
    id: "m-01-f23b-482a",
    full_name: "Marcus Aurelius",
    email: "marcus.philosophy@olympus.com",
    phone: "555-0144",
    age: 34,
    gender: "Male",
    plan_type: "Platinum",
    status: "Active",
    join_date: "2026-01-12",
    trainer_assigned: "Marcus Vance",
    monthly_fee: 100,
    notes: "Focuses on olympic weightlifting and mobility. Prefers heavy squats.",
    created_at: new Date(2026, 0, 12).toISOString()
  },
  {
    id: "m-02-a7d5-8941",
    full_name: "Elena Rostova",
    email: "elena.yoga@gym.net",
    phone: "555-0177",
    age: 28,
    gender: "Female",
    plan_type: "Gold",
    status: "Active",
    join_date: "2026-02-20",
    trainer_assigned: "Elena Rostova",
    monthly_fee: 60,
    notes: "Self-training trainer. Teaches Vinyasa flow.",
    created_at: new Date(2026, 1, 20).toISOString()
  },
  {
    id: "m-03-c4e9-1122",
    full_name: "David Beckham",
    email: "david.becks@united.co.uk",
    phone: "555-0199",
    age: 41,
    gender: "Male",
    plan_type: "Gold",
    status: "Active",
    join_date: "2026-03-05",
    trainer_assigned: "Sarah Jenkins",
    monthly_fee: 60,
    notes: "High intensity cardiovascular conditioning. Healing previous hamstring pull.",
    created_at: new Date(2026, 2, 5).toISOString()
  },
  {
    id: "m-04-18e4-ff29",
    full_name: "Serena Williams",
    email: "serena.champion@courts.com",
    phone: "555-0182",
    age: 39,
    gender: "Female",
    plan_type: "Platinum",
    status: "Pending",
    join_date: "2026-04-18",
    trainer_assigned: "Alex Rivera",
    monthly_fee: 100,
    notes: "Power development and core rotational stability.",
    created_at: new Date(2026, 3, 18).toISOString()
  },
  {
    id: "m-05-bc82-9902",
    full_name: "Christian Bale",
    email: "christian@gotham.org",
    phone: "555-0100",
    age: 44,
    gender: "Male",
    plan_type: "Silver",
    status: "Expired",
    join_date: "2026-05-01",
    trainer_assigned: "None",
    monthly_fee: 35,
    notes: "Cardio workouts only. Member subscription expired this week.",
    created_at: new Date(2026, 4, 1).toISOString()
  }
];

// --- Chart Instances ---
let growthChartInstance = null;
let distributionChartInstance = null;

// --- Initialize Application ---
document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();
  initFormPricingLink();
  initSearchRedirect();
  
  // Connect to database in the background (if keys are supplied)
  await checkDatabaseConnection();
  
  // Seed local storage if empty
  if (!localStorage.getItem("stargym_members")) {
    localStorage.setItem("stargym_members", JSON.stringify(INITIAL_SEED_MEMBERS));
  }
  
  // Seed activity log if empty
  if (!localStorage.getItem("stargym_activity_logs")) {
    const defaultLogs = [
      { text: "System database initialized.", type: "info", time: new Date().toISOString() }
    ];
    localStorage.setItem("stargym_activity_logs", JSON.stringify(defaultLogs));
  }
  
  // Set default registration date to today's date in form
  document.getElementById("memberJoinDate").value = new Date().toISOString().split('T')[0];
  
  // Initial fetch and layout render
  await refreshData();
  
  // Setup quick trigger buttons
  document.getElementById("addMemberQuickBtn").addEventListener("click", () => switchView("addMember"));
});

// ==========================================================================
// DB Connection & CRUD Operations Abstractor
// ==========================================================================

// Check if credentials exist and initialize client
async function checkDatabaseConnection() {
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      // Initialize Supabase Client
      dbState.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      
      // Perform a ping check to test credentials
      const { data, error } = await dbState.supabaseClient
        .from('members')
        .select('id')
        .limit(1);
        
      if (error) throw error;
      
      // Successfully Connected
      dbState.isSupabase = true;
      addLog("Synchronized live database.", "success");
      
    } catch (err) {
      console.error("Database connection failed:", err);
      // Fallback
      dbState.isSupabase = false;
      dbState.supabaseClient = null;
      addLog("Using localized offline database store.", "error");
    }
  } else {
    // Quiet Offline Mode
    dbState.isSupabase = false;
    dbState.supabaseClient = null;
  }
}

// Fetch all members
async function apiGetMembers() {
  if (dbState.isSupabase && dbState.supabaseClient) {
    try {
      const { data, error } = await dbState.supabaseClient
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Database fetch members error:", err);
      return JSON.parse(localStorage.getItem("stargym_members")) || [];
    }
  } else {
    return JSON.parse(localStorage.getItem("stargym_members")) || [];
  }
}

// Create new member
async function apiCreateMember(member) {
  if (dbState.isSupabase && dbState.supabaseClient) {
    try {
      const { data, error } = await dbState.supabaseClient
        .from('members')
        .insert([member])
        .select();
        
      if (error) throw error;
      return data[0];
    } catch (err) {
      console.error("Database insert error:", err);
      throw new Error("Failed to insert record: " + err.message);
    }
  } else {
    const localMembers = JSON.parse(localStorage.getItem("stargym_members")) || [];
    member.id = "m-" + Math.floor(Math.random() * 1000000).toString(16);
    member.created_at = new Date().toISOString();
    localMembers.unshift(member);
    localStorage.setItem("stargym_members", JSON.stringify(localMembers));
    return member;
  }
}

// Update existing member
async function apiUpdateMember(id, memberData) {
  if (dbState.isSupabase && dbState.supabaseClient) {
    try {
      const { data, error } = await dbState.supabaseClient
        .from('members')
        .update(memberData)
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data[0];
    } catch (err) {
      console.error("Database update error:", err);
      throw new Error("Failed to update record: " + err.message);
    }
  } else {
    const localMembers = JSON.parse(localStorage.getItem("stargym_members")) || [];
    const index = localMembers.findIndex(m => m.id === id);
    if (index !== -1) {
      const updated = { ...localMembers[index], ...memberData };
      localMembers[index] = updated;
      localStorage.setItem("stargym_members", JSON.stringify(localMembers));
      return updated;
    }
    throw new Error("Record not found in local storage.");
  }
}

// Delete member
async function apiDeleteMember(id) {
  if (dbState.isSupabase && dbState.supabaseClient) {
    try {
      const { error } = await dbState.supabaseClient
        .from('members')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Database delete error:", err);
      throw new Error("Failed to delete record: " + err.message);
    }
  } else {
    let localMembers = JSON.parse(localStorage.getItem("stargym_members")) || [];
    localMembers = localMembers.filter(m => m.id !== id);
    localStorage.setItem("stargym_members", JSON.stringify(localMembers));
    return true;
  }
}

// ==========================================================================
// Data Synchronization & Rendering
// ==========================================================================

// Global state sync and refresh UI
async function refreshData() {
  dbState.members = await apiGetMembers();
  
  // Render views dynamically
  renderDashboard();
  renderMembersList();
  renderActivityLogs();
}

// Render Dashboard Panel KPIs and Charts
function renderDashboard() {
  const members = dbState.members;
  
  // 1. Calculate Core KPIs
  const total = members.length;
  const activeCount = members.filter(m => m.status === 'Active').length;
  const activePercent = total > 0 ? Math.round((activeCount / total) * 100) : 0;
  
  // Sum monthly fees for active members
  const estimatedRevenue = members
    .filter(m => m.status === 'Active')
    .reduce((sum, m) => sum + parseFloat(m.monthly_fee || 0), 0);
    
  const platinumCount = members.filter(m => m.plan_type === 'Platinum').length;
  
  // 2. Set KPI Texts (Currency symbol removed)
  document.getElementById("statTotalMembers").textContent = total;
  document.getElementById("statActiveMembers").textContent = activeCount;
  document.getElementById("statActivePercentage").textContent = `${activePercent}% Active`;
  document.getElementById("statMonthlyRevenue").textContent = "₹" + estimatedRevenue.toLocaleString();
  document.getElementById("statPremiumPlans").textContent = platinumCount;
  
  // 3. Render Chart.js Distributions
  renderPlanDistributionChart(members);
  renderSignupGrowthChart(members);
}

// Render Plan Distribution (Doughnut Chart)
function renderPlanDistributionChart(members) {
  const ctx = document.getElementById("planDistributionChart").getContext("2d");
  
  if (distributionChartInstance) {
    distributionChartInstance.destroy();
  }
  
  const planCounts = { Platinum: 0, Gold: 0, Silver: 0 };
  members.forEach(m => {
    if (planCounts[m.plan_type] !== undefined) {
      planCounts[m.plan_type]++;
    }
  });
  
  distributionChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Platinum', 'Gold', 'Silver'],
      datasets: [{
        data: [planCounts.Platinum, planCounts.Gold, planCounts.Silver],
        backgroundColor: [
          'hsl(192, 95%, 50%)',  // Electric Cyan
          'hsl(40, 100%, 55%)',   // Golden Warning
          'hsl(220, 10%, 65%)'    // Silver Muted
        ],
        borderColor: 'hsl(220, 18%, 10%)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'hsl(0, 0%, 85%)',
            font: { family: 'Outfit', size: 12 }
          }
        }
      },
      cutout: '65%'
    }
  });
}

// Render Monthly Signups Growth (Bar Chart)
function renderSignupGrowthChart(members) {
  const ctx = document.getElementById("membershipGrowthChart").getContext("2d");
  
  if (growthChartInstance) {
    growthChartInstance.destroy();
  }
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const counts = Array(12).fill(0);
  const labels = [];
  
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Generate labels for Jan to Dec of the current calendar year
  for (let m = 0; m < 12; m++) {
    labels.push(`${monthNames[m]} ${currentYear.toString().substr(-2)}`);
  }
  
  // Group members into respective buckets for the current calendar year
  members.forEach(m => {
    if (!m.join_date) return;
    
    // Parse year/month directly from "YYYY-MM-DD" to avoid local browser timezone shifts
    const parts = m.join_date.split('-');
    if (parts.length >= 2) {
      const joinYear = parseInt(parts[0]);
      const joinMonth = parseInt(parts[1]) - 1; // 0-indexed month
      
      if (joinYear === currentYear) {
        if (joinMonth >= 0 && joinMonth < 12) {
          counts[joinMonth]++;
        }
      }
    }
  });
  
  growthChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'New Registrations',
        data: counts,
        backgroundColor: 'rgba(57, 255, 20, 0.2)', // translucent neon green
        borderColor: 'hsl(138, 90%, 55%)',
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: 'hsl(138, 90%, 55%)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: 'hsl(220, 10%, 65%)', font: { family: 'Inter', size: 10 } }
        },
        y: {
          grid: { color: 'hsla(220, 13%, 22%, 0.4)' },
          ticks: { 
            color: 'hsl(220, 10%, 65%)', 
            font: { family: 'Inter' },
            stepSize: 1
          }
        }
      }
    }
  });
}

// Render Members Table Directory
function renderMembersList() {
  const tableBody = document.getElementById("membersTableBody");
  const planFilter = document.getElementById("filterPlan").value;
  const statusFilter = document.getElementById("filterStatus").value;
  const searchQuery = document.getElementById("quickSearch").value.toLowerCase().trim();
  
  tableBody.innerHTML = "";
  
  const filtered = dbState.members.filter(m => {
    const matchPlan = (planFilter === "all" || m.plan_type === planFilter);
    const matchStatus = (statusFilter === "all" || m.status === statusFilter);
    const matchSearch = (
      m.full_name.toLowerCase().includes(searchQuery) ||
      m.email.toLowerCase().includes(searchQuery) ||
      m.phone.includes(searchQuery) ||
      (m.trainer_assigned && m.trainer_assigned.toLowerCase().includes(searchQuery))
    );
    
    return matchPlan && matchStatus && matchSearch;
  });
  
  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="table-empty-state">
            <i class="fa-solid fa-users-slash"></i>
            <p>No members match the selected filters or search parameters.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  filtered.forEach(m => {
    const row = document.createElement("tr");
    
    const planClass = m.plan_type.toLowerCase();
    const statusClass = m.status.toLowerCase();
    
    // Currency sign ($) prefix removed from monthly fee column
    row.innerHTML = `
      <td>
        <div class="member-cell-info">
          <span class="member-cell-name">${escapeHTML(m.full_name)}</span>
          <span class="member-cell-email">${escapeHTML(m.email)}</span>
        </div>
      </td>
      <td>
        <div style="font-size: 13px;">
          <div><i class="fa-solid fa-phone" style="width: 16px; color: var(--text-muted);"></i> ${escapeHTML(m.phone)}</div>
          <div><i class="fa-solid fa-venus-mars" style="width: 16px; color: var(--text-muted);"></i> Age: ${m.age} (${m.gender})</div>
        </div>
      </td>
      <td style="font-family: 'Outfit', sans-serif;">${formatDateString(m.join_date)}</td>
      <td>
        <span style="font-size: 13px; font-weight: 500;">
          ${m.trainer_assigned === "None" ? '<span style="color: var(--text-muted);">Unassigned</span>' : escapeHTML(m.trainer_assigned)}
        </span>
      </td>
      <td>
        <span class="plan-badge ${planClass}">${m.plan_type}</span>
      </td>
      <td style="font-weight: 700; font-family: 'Outfit', sans-serif;">₹${m.monthly_fee}</td>
      <td>
        <span class="status-badge ${statusClass}">${m.status}</span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn-action edit" onclick="initiateEditMember('${m.id}')" title="Edit Member Info">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-action delete" onclick="confirmDeleteMember('${m.id}', '${escapeJSString(m.full_name)}')" title="Delete Member">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Render Activity Logs List
function renderActivityLogs() {
  const listContainer = document.getElementById("activityLogsList");
  listContainer.innerHTML = "";
  
  const logs = JSON.parse(localStorage.getItem("stargym_activity_logs")) || [];
  
  if (logs.length === 0) {
    listContainer.innerHTML = `<p style="font-size: 13px; color: var(--text-muted);">No recent logs recorded.</p>`;
    return;
  }
  
  logs.slice(0, 5).forEach(log => {
    const item = document.createElement("div");
    item.className = "activity-item";
    
    let badgeClass = "add";
    let badgeIcon = "fa-plus";
    if (log.type === "edit") {
      badgeClass = "edit";
      badgeIcon = "fa-pen-to-square";
    } else if (log.type === "delete") {
      badgeClass = "delete";
      badgeIcon = "fa-trash-can";
    } else if (log.type === "error") {
      badgeClass = "delete";
      badgeIcon = "fa-triangle-exclamation";
    }
    
    item.innerHTML = `
      <div class="activity-left">
        <div class="activity-badge ${badgeClass}">
          <i class="fa-solid ${badgeIcon}"></i>
        </div>
        <div class="activity-desc">
          <span class="activity-text">${log.text}</span>
          <span class="activity-time">${formatTimeAgo(log.time)}</span>
        </div>
      </div>
    `;
    listContainer.appendChild(item);
  });
}

// Add a log to local storage
function addLog(text, type = "info") {
  const logs = JSON.parse(localStorage.getItem("stargym_activity_logs")) || [];
  logs.unshift({ text, type, time: new Date().toISOString() });
  localStorage.setItem("stargym_activity_logs", JSON.stringify(logs.slice(0, 50)));
  renderActivityLogs();
}

// ==========================================================================
// View Routing & Search Handler
// ==========================================================================

// Setup sidebar navigations
function setupNavigation() {
  const menuItems = document.querySelectorAll(".menu-item");
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("appSidebar");
  
  menuItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      
      menuItems.forEach(m => m.classList.remove("active"));
      item.classList.add("active");
      
      const viewName = item.getAttribute("data-view");
      switchView(viewName);
      
      if (window.innerWidth <= 900) {
        sidebar.classList.remove("active");
      }
    });
  });
  
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
  });
}

// Router trigger
function switchView(viewId) {
  const sections = document.querySelectorAll(".view-section");
  const activeSectionId = viewId + "View";
  
  sections.forEach(sec => {
    if (sec.id === activeSectionId) {
      sec.classList.add("active");
    } else {
      sec.classList.remove("active");
    }
  });
  
  const menuItems = document.querySelectorAll(".menu-item");
  menuItems.forEach(item => {
    if (item.getAttribute("data-view") === viewId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
  
  if (viewId === "addMember" && !document.getElementById("editMemberId").value) {
    resetRegistrationForm();
  }
}

// Redirect quicksearch in header to members list page dynamically
function initSearchRedirect() {
  const searchInput = document.getElementById("quickSearch");
  const planFilter = document.getElementById("filterPlan");
  const statusFilter = document.getElementById("filterStatus");
  
  searchInput.addEventListener("input", () => {
    switchView("membersList");
    renderMembersList();
  });
  
  planFilter.addEventListener("change", renderMembersList);
  statusFilter.addEventListener("change", renderMembersList);
}

// ==========================================================================
// Form Submission, Pricing & Validation
// ==========================================================================

// Handle auto-updating monthly fee when plan cards selected
function initFormPricingLink() {
  const planRadios = document.querySelectorAll("input[name='memberPlan']");
  const feeInput = document.getElementById("memberFee");
  const cancelBtn = document.getElementById("btnCancelForm");
  const registerForm = document.getElementById("memberRegisterForm");
  
  planRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      feeInput.value = e.target.getAttribute("data-fee");
    });
  });
  
  cancelBtn.addEventListener("click", () => {
    resetRegistrationForm();
    switchView("membersList");
  });
  
  registerForm.addEventListener("submit", handleFormSubmission);
}

// Submit member details
async function handleFormSubmission(e) {
  e.preventDefault();
  
  const editId = document.getElementById("editMemberId").value;
  const nameVal = document.getElementById("memberName").value.trim();
  const name = nameVal || "Unnamed Member";
  
  const emailVal = document.getElementById("memberEmail").value.trim();
  const email = emailVal || "N/A";
  
  const phoneVal = document.getElementById("memberPhone").value.trim();
  const phone = phoneVal || "N/A";
  
  const ageVal = document.getElementById("memberAge").value;
  const age = ageVal ? parseInt(ageVal) : 0;
  
  const genderVal = document.getElementById("memberGender").value;
  const gender = genderVal || "Unspecified";
  
  const plan_type = document.querySelector("input[name='memberPlan']:checked").value;
  const trainer_assigned = document.getElementById("memberTrainer").value;
  
  const feeVal = document.getElementById("memberFee").value;
  const monthly_fee = feeVal ? parseFloat(feeVal) : 0;
  
  const status = document.querySelector("input[name='memberStatus']:checked").value;
  
  const joinDateVal = document.getElementById("memberJoinDate").value;
  const join_date = joinDateVal || new Date().toISOString().split('T')[0];
  
  const notes = document.getElementById("memberNotes").value.trim();
  
  // Validate age only if it is actually supplied
  if (ageVal && (age < 14 || age > 100)) {
    showToast("Invalid Age", "Members must be between 14 and 100 years old.", "warning");
    return;
  }
  
  const newMemberObj = {
    full_name: name,
    email: email,
    phone: phone,
    age: age,
    gender: gender,
    plan_type: plan_type,
    trainer_assigned: trainer_assigned,
    monthly_fee: monthly_fee,
    status: status,
    join_date: join_date,
    notes: notes
  };
  
  const submitBtn = document.getElementById("btnSubmitForm");
  submitBtn.disabled = true;
  submitBtn.textContent = editId ? "Updating..." : "Registering...";
  
  try {
    if (editId) {
      await apiUpdateMember(editId, newMemberObj);
      showToast("Success", `${name}'s record has been updated successfully.`, "success");
      addLog(`Updated profile details for member: ${name}`, "edit");
    } else {
      await apiCreateMember(newMemberObj);
      showToast("Registration Complete", `${name} is now registered!`, "success");
      addLog(`Registered new member: ${name} (${plan_type} Plan)`, "add");
    }
    
    await refreshData();
    resetRegistrationForm();
    switchView("membersList");
    
  } catch (err) {
    console.error("Save Error:", err);
    showToast("Failed to Save Record", err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = editId ? "Save Changes" : "Register Member";
  }
}

// Reset member form
function resetRegistrationForm() {
  document.getElementById("editMemberId").value = "";
  document.getElementById("memberRegisterForm").reset();
  
  document.getElementById("formHeaderTitle").textContent = "Member Registration";
  document.getElementById("formHeaderSubtitle").textContent = "Register a new client into the database.";
  document.getElementById("btnSubmitForm").textContent = "Register Member";
  document.getElementById("memberJoinDate").value = new Date().toISOString().split('T')[0];
  
  document.querySelector("input[name='memberPlan'][value='Silver']").checked = true;
  document.getElementById("memberFee").value = 35;
  document.querySelector("input[name='memberStatus'][value='Active']").checked = true;
}

// Trigger edit routine
function initiateEditMember(id) {
  const member = dbState.members.find(m => m.id === id);
  if (!member) {
    showToast("Error", "Unable to locate member profile record.", "error");
    return;
  }
  
  switchView("addMember");
  
  document.getElementById("editMemberId").value = member.id;
  document.getElementById("memberName").value = member.full_name === "Unnamed Member" ? "" : member.full_name;
  document.getElementById("memberEmail").value = member.email === "N/A" ? "" : member.email;
  document.getElementById("memberPhone").value = member.phone === "N/A" ? "" : member.phone;
  document.getElementById("memberAge").value = member.age === 0 ? "" : member.age;
  document.getElementById("memberGender").value = member.gender === "Unspecified" ? "" : member.gender;
  
  const planRadio = document.querySelector(`input[name='memberPlan'][value='${member.plan_type}']`);
  if (planRadio) planRadio.checked = true;
  
  document.getElementById("memberTrainer").value = member.trainer_assigned || "None";
  document.getElementById("memberFee").value = member.monthly_fee;
  
  const statusRadio = document.querySelector(`input[name='memberStatus'][value='${member.status}']`);
  if (statusRadio) statusRadio.checked = true;
  
  document.getElementById("memberJoinDate").value = member.join_date;
  document.getElementById("memberNotes").value = member.notes || "";
  
  document.getElementById("formHeaderTitle").textContent = "Edit Member Record";
  document.getElementById("formHeaderSubtitle").textContent = `Modifying files for ${member.full_name}`;
  document.getElementById("btnSubmitForm").textContent = "Save Changes";
}

// Trigger delete prompt
async function confirmDeleteMember(id, name) {
  if (confirm(`Are you absolutely sure you want to delete member: ${name}?\nThis action cannot be undone.`)) {
    try {
      await apiDeleteMember(id);
      showToast("Deleted", `${name} has been removed from database.`, "info");
      addLog(`Deleted member profile: ${name}`, "delete");
      await refreshData();
    } catch (err) {
      showToast("Delete Failed", err.message, "error");
    }
  }
}

// ==========================================================================
// Toast Alerts System
// ==========================================================================

function showToast(title, message, type = 'success') {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = "fa-circle-check";
  if (type === "error") icon = "fa-circle-xmark";
  else if (type === "warning") icon = "fa-triangle-exclamation";
  else if (type === "info") icon = "fa-circle-info";
  
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fa-solid ${icon}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;
  
  container.appendChild(toast);
  
  const autoClose = setTimeout(() => {
    removeToast(toast);
  }, 4000);
  
  toast.querySelector(".toast-close").addEventListener("click", () => {
    clearTimeout(autoClose);
    removeToast(toast);
  });
}

function removeToast(toast) {
  toast.style.animation = "slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse forwards";
  toast.addEventListener("animationend", () => {
    toast.remove();
  });
}

// ==========================================================================
// Formatting & Escaping Helpers
// ==========================================================================

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function escapeJSString(str) {
  if (!str) return '';
  return str.replace(/['"\\]/g, '\\$&');
}

function formatDateString(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatTimeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);
  
  if (seconds < 60) return "just now";
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
