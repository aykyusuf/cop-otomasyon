import { create } from "zustand";
import type { Student, CreditTransaction, Badge, WasteType, BadgeId } from "@/types";

// ─── Sabitler ───────────────────────────────────────────────────────────────

export const CREDIT_AMOUNTS: Record<WasteType, number> = {
  recyclable: 3,
  organic: 2,
  general: 1,
  hazardous: 5,
};

export const STREAK_BONUS = 2;
export const FIRST_THROW_BONUS = 5;

export const BADGES: Badge[] = [
  {
    id: "first_throw",
    name: "İlk Atış",
    icon: "🎉",
    description: "İlk kez çöp attın!",
    requiredCredits: 0,
  },
  {
    id: "beginner",
    name: "Başlangıç",
    icon: "🌱",
    description: "20 kredi kazandın",
    requiredCredits: 20,
  },
  {
    id: "recycler",
    name: "Geri Dönüşümcü",
    icon: "♻️",
    description: "50 kredi kazandın",
    requiredCredits: 50,
  },
  {
    id: "green_campus",
    name: "Yeşil Kampüs",
    icon: "🌿",
    description: "150 kredi kazandın",
    requiredCredits: 150,
  },
  {
    id: "streak_master",
    name: "Seri Ustası",
    icon: "🔥",
    description: "3 gün arka arkaya atış yaptın",
    requiredCredits: 0,
  },
  {
    id: "eco_champion",
    name: "Eko Şampiyon",
    icon: "🏆",
    description: "300 kredi kazandın",
    requiredCredits: 300,
  },
];

// ─── Mock Öğrenci Verisi ─────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Bilgisayar Mühendisliği",
  "Elektrik-Elektronik Müh.",
  "İnşaat Mühendisliği",
  "Endüstri Mühendisliği",
  "Çevre Mühendisliği",
  "İşletme",
  "Psikoloji",
  "Fizik",
  "Kimya",
  "Biyoloji",
];

const NAMES = [
  "Ahmet Yılmaz",
  "Fatma Demir",
  "Mehmet Kaya",
  "Ayşe Çelik",
  "Mustafa Şahin",
  "Zeynep Arslan",
  "Emre Doğan",
  "Selin Aydın",
  "Burak Yıldız",
  "Elif Öztürk",
  "Can Koç",
  "Merve Güneş",
  "Serkan Polat",
  "Büşra Erdoğan",
  "Oğuz Çetin",
];

function makeMockStudents(): Student[] {
  return NAMES.map((name, i) => {
    const credits = Math.floor(Math.random() * 200) + 5;
    const streakDays = Math.floor(Math.random() * 6);
    const totalThrows = Math.floor(credits / 2);
    const recyclingRate = Math.floor(Math.random() * 60) + 30;

    const badges: BadgeId[] = ["first_throw"];
    if (credits >= 20) badges.push("beginner");
    if (credits >= 50) badges.push("recycler");
    if (credits >= 150) badges.push("green_campus");
    if (credits >= 300) badges.push("eco_champion");
    if (streakDays >= 3) badges.push("streak_master");

    return {
      id: `student-${i + 1}`,
      name,
      studentNo: `2021${String(i + 1).padStart(5, "0")}`,
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      credits,
      streakDays,
      lastActivity: new Date(Date.now() - Math.random() * 7 * 86400000),
      badges,
      totalThrows,
      recyclingRate,
      createdAt: new Date(2024, 8, 15),
    };
  });
}

function makeTransactionId() {
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Store Arayüzü ────────────────────────────────────────────────────────────

interface IncentiveStore {
  students: Student[];
  transactions: CreditTransaction[];
  initialized: boolean;
  lastAwardedStudentId: string | null;
  lastAwardedAmount: number;

  init: () => void;
  awardCredits: (
    studentId: string,
    wasteType: WasteType,
    binName?: string
  ) => { student: Student; amount: number; newBadges: BadgeId[] };
  awardCreditsToRandom: (wasteType: WasteType, binName?: string) => void;
  getLeaderboard: () => Student[];
  getStudentTransactions: (studentId: string) => CreditTransaction[];
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useIncentiveStore = create<IncentiveStore>((set, get) => ({
  students: [],
  transactions: [],
  initialized: false,
  lastAwardedStudentId: null,
  lastAwardedAmount: 0,

  init: () => {
    if (get().initialized) return;
    set({ students: makeMockStudents(), initialized: true });
  },

  awardCredits: (studentId, wasteType, binName) => {
    const { students, transactions } = get();
    const student = students.find((s) => s.id === studentId);
    if (!student) throw new Error("Öğrenci bulunamadı");

    const base = CREDIT_AMOUNTS[wasteType];
    const isFirstThrow = student.totalThrows === 0;
    const streakBonus = student.streakDays >= 3 ? STREAK_BONUS : 0;
    const firstThrowBonus = isFirstThrow ? FIRST_THROW_BONUS : 0;
    const total = base + streakBonus + firstThrowBonus;

    const newCredits = student.credits + total;

    // Rozet kontrolü
    const badgesBefore = new Set(student.badges);
    const newBadgesList: BadgeId[] = [];

    if (isFirstThrow && !badgesBefore.has("first_throw")) {
      newBadgesList.push("first_throw");
    }
    for (const badge of BADGES) {
      if (
        badge.requiredCredits > 0 &&
        newCredits >= badge.requiredCredits &&
        !badgesBefore.has(badge.id)
      ) {
        newBadgesList.push(badge.id);
      }
    }

    const updatedStudent: Student = {
      ...student,
      credits: newCredits,
      totalThrows: student.totalThrows + 1,
      badges: [...student.badges, ...newBadgesList],
      lastActivity: new Date(),
      recyclingRate:
        wasteType === "recyclable"
          ? Math.min(100, student.recyclingRate + 1)
          : student.recyclingRate,
    };

    const tx: CreditTransaction = {
      id: makeTransactionId(),
      studentId,
      amount: total,
      reason: `${CREDIT_AMOUNTS[wasteType]} temel + ${streakBonus} streak + ${firstThrowBonus} ilk atış`,
      wasteType,
      binName,
      createdAt: new Date(),
    };

    set({
      students: students.map((s) => (s.id === studentId ? updatedStudent : s)),
      transactions: [tx, ...transactions].slice(0, 500),
      lastAwardedStudentId: studentId,
      lastAwardedAmount: total,
    });

    return { student: updatedStudent, amount: total, newBadges: newBadgesList };
  },

  awardCreditsToRandom: (wasteType, binName) => {
    const { students, awardCredits } = get();
    if (students.length === 0) return;
    const random = students[Math.floor(Math.random() * students.length)];
    awardCredits(random.id, wasteType, binName);
  },

  getLeaderboard: () => {
    return [...get().students].sort((a, b) => b.credits - a.credits);
  },

  getStudentTransactions: (studentId) => {
    return get().transactions.filter((t) => t.studentId === studentId);
  },
}));
