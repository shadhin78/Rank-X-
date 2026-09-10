import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestoreDb } from '@/src/lib/firebase';
import type { StudyProgram, Subject, Chapter, ProgramStatus, ChapterStatus } from '@/src/types';
import { scoringService } from './scoringService';

// Storage keys for offline resilience & immediate local responsiveness
const LOCAL_PROGRAMS_PREFIX = 'studyrank_programs_';
const LOCAL_SUBJECTS_PREFIX = 'studyrank_subjects_';
const LOCAL_CHAPTERS_PREFIX = 'studyrank_chapters_';

function getLocalData<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('[ProgramService] Could not save local cache:', err);
  }
}

/**
 * Seed sample data for first-time users as specified in the prompt
 * (e.g. BBA 2nd Year with Financial Accounting & Finance)
 */
export function seedDefaultProgramForUser(ownerUid: string): {
  program: StudyProgram;
  subjects: Subject[];
  chapters: Chapter[];
} {
  const now = new Date().toISOString();
  const programId = `prog-${Date.now()}`;
  const sub1Id = `sub-acc-${Date.now()}`;
  const sub2Id = `sub-fin-${Date.now()}`;

  const defaultProgram: StudyProgram = {
    id: programId,
    ownerUid,
    name: 'BBA 2nd Year',
    description: 'Core semester curriculum covering Financial Accounting and Corporate Finance.',
    startDate: new Date().toISOString().split('T')[0],
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    totalSubjects: 2,
    totalChapters: 5,
    completedChapters: 1,
    progressPercentage: 20,
    createdAt: now,
    updatedAt: now,
  };

  const subjects: Subject[] = [
    {
      id: sub1Id,
      programId,
      ownerUid,
      name: 'Financial Accounting',
      description: 'Double-entry mechanics, trial balances, and financial statement analysis.',
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: sub2Id,
      programId,
      ownerUid,
      name: 'Finance',
      description: 'Capital budgeting, time value of money, and risk-return trade-offs.',
      order: 2,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const chapters: Chapter[] = [
    {
      id: `chap-${Date.now()}-1`,
      programId,
      subjectId: sub1Id,
      ownerUid,
      name: 'Chapter 1: Principles of Accounting & Ledger Postings',
      description: 'Foundational accounting concepts, debit/credit rules, and journalizing transactions.',
      order: 1,
      status: 'completed',
      targetDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedMinutes: 120,
      actualMinutes: 110,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `chap-${Date.now()}-2`,
      programId,
      subjectId: sub1Id,
      ownerUid,
      name: 'Chapter 2: Financial Statements & Balance Sheet Preparation',
      description: 'Income statements, equity changes, and asset/liability classifications.',
      order: 2,
      status: 'in_progress',
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedMinutes: 90,
      actualMinutes: 45,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `chap-${Date.now()}-3`,
      programId,
      subjectId: sub1Id,
      ownerUid,
      name: 'Chapter 3: Cash Flow Statements & Reconciliation',
      description: 'Operating, investing, and financing cash flows under direct/indirect methods.',
      order: 3,
      status: 'not_started',
      targetDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedMinutes: 150,
      actualMinutes: 0,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `chap-${Date.now()}-4`,
      programId,
      subjectId: sub2Id,
      ownerUid,
      name: 'Chapter 1: Time Value of Money & Annuities',
      description: 'Discounting, compounding, ordinary annuities, and perpetuity valuations.',
      order: 1,
      status: 'not_started',
      targetDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedMinutes: 100,
      actualMinutes: 0,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `chap-${Date.now()}-5`,
      programId,
      subjectId: sub2Id,
      ownerUid,
      name: 'Chapter 2: Capital Budgeting & Net Present Value (NPV)',
      description: 'IRR, payback period, and capital rationing for investment decisions.',
      order: 2,
      status: 'not_started',
      targetDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedMinutes: 140,
      actualMinutes: 0,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return { program: defaultProgram, subjects, chapters };
}

export const programService = {
  // ==========================================
  // PROGRAM OPERATIONS
  // ==========================================

  /**
   * Explicitly seeds the default sample BBA curriculum for a user
   */
  async seedDefaultProgram(ownerUid: string): Promise<StudyProgram> {
    const seeded = seedDefaultProgramForUser(ownerUid);
    const localKey = `${LOCAL_PROGRAMS_PREFIX}${ownerUid}`;
    const cached = getLocalData<StudyProgram>(localKey);
    saveLocalData(localKey, [seeded.program, ...cached]);
    saveLocalData(`${LOCAL_SUBJECTS_PREFIX}${ownerUid}`, seeded.subjects);
    saveLocalData(`${LOCAL_CHAPTERS_PREFIX}${ownerUid}`, seeded.chapters);

    try {
      await setDoc(doc(firestoreDb, 'programs', seeded.program.id), seeded.program);
      for (const s of seeded.subjects) {
        await setDoc(doc(firestoreDb, 'subjects', s.id), s);
      }
      for (const c of seeded.chapters) {
        await setDoc(doc(firestoreDb, 'chapters', c.id), c);
      }
    } catch (e) {
      console.warn('[ProgramService] seedDefaultProgram Firestore write notice:', e);
    }

    return seeded.program;
  },

  /**
   * Subscribe to programs for the active user with realtime updates
   */
  subscribePrograms(
    ownerUid: string,
    onUpdate: (programs: StudyProgram[]) => void
  ): Unsubscribe {
    const localKey = `${LOCAL_PROGRAMS_PREFIX}${ownerUid}`;
    const cached = getLocalData<StudyProgram>(localKey);

    // If cache is empty for this user, seed default sample curriculum
    if (cached.length === 0) {
      const seeded = seedDefaultProgramForUser(ownerUid);
      saveLocalData(localKey, [seeded.program]);
      saveLocalData(`${LOCAL_SUBJECTS_PREFIX}${ownerUid}`, seeded.subjects);
      saveLocalData(`${LOCAL_CHAPTERS_PREFIX}${ownerUid}`, seeded.chapters);
      onUpdate([seeded.program]);

      // Attempt to save seeded records to Firestore in background
      (async () => {
        try {
          await setDoc(doc(firestoreDb, 'programs', seeded.program.id), seeded.program);
          for (const s of seeded.subjects) {
            await setDoc(doc(firestoreDb, 'subjects', s.id), s);
          }
          for (const c of seeded.chapters) {
            await setDoc(doc(firestoreDb, 'chapters', c.id), c);
          }
        } catch (e) {
          console.debug('[ProgramService] Firestore background seeding fallback to local:', e);
        }
      })();
    } else {
      onUpdate(cached);
    }

    try {
      const q = query(
        collection(firestoreDb, 'programs'),
        where('ownerUid', '==', ownerUid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as StudyProgram);
            // Sort by createdAt descending
            list.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            saveLocalData(localKey, list);
            onUpdate(list);
          } else if (cached.length > 0) {
            // Firestore returned empty, keep local or push local
            onUpdate(cached);
          }
        },
        (error) => {
          console.warn('[ProgramService] Realtime listener error, fallback to cache:', error);
          onUpdate(getLocalData<StudyProgram>(localKey));
        }
      );

      return unsubscribe;
    } catch {
      return () => {};
    }
  },

  /**
   * Get all programs for a user
   */
  async getPrograms(ownerUid: string): Promise<StudyProgram[]> {
    const localKey = `${LOCAL_PROGRAMS_PREFIX}${ownerUid}`;
    try {
      const q = query(
        collection(firestoreDb, 'programs'),
        where('ownerUid', '==', ownerUid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as StudyProgram);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        saveLocalData(localKey, list);
        return list;
      }
    } catch (e) {
      console.warn('[ProgramService] getPrograms fallback to local:', e);
    }
    return getLocalData<StudyProgram>(localKey);
  },

  /**
   * Get single program by ID
   */
  async getProgramById(programId: string, ownerUid: string): Promise<StudyProgram | null> {
    const localKey = `${LOCAL_PROGRAMS_PREFIX}${ownerUid}`;
    try {
      const snap = await getDoc(doc(firestoreDb, 'programs', programId));
      if (snap.exists()) {
        const data = snap.data() as StudyProgram;
        if (data.ownerUid === ownerUid) {
          return data;
        }
        return null;
      }
    } catch (e) {
      console.warn('[ProgramService] getProgramById fallback to local:', e);
    }
    const local = getLocalData<StudyProgram>(localKey);
    return local.find((p) => p.id === programId && p.ownerUid === ownerUid) || null;
  },

  /**
   * Create a new Program
   */
  async createProgram(
    ownerUid: string,
    data: {
      name: string;
      description?: string;
      startDate?: string;
      targetDate?: string;
    }
  ): Promise<StudyProgram> {
    const now = new Date().toISOString();
    const id = `prog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newProgram: StudyProgram = {
      id,
      ownerUid,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      targetDate: data.targetDate || '',
      status: 'active',
      totalSubjects: 0,
      totalChapters: 0,
      completedChapters: 0,
      progressPercentage: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Update local cache
    const localKey = `${LOCAL_PROGRAMS_PREFIX}${ownerUid}`;
    const list = getLocalData<StudyProgram>(localKey);
    list.unshift(newProgram);
    saveLocalData(localKey, list);

    // Save to Firestore
    try {
      await setDoc(doc(firestoreDb, 'programs', id), newProgram);
    } catch (e) {
      console.warn('[ProgramService] createProgram saved locally, Firestore error:', e);
    }

    return newProgram;
  },

  /**
   * Edit a program's details
   */
  async updateProgram(
    programId: string,
    ownerUid: string,
    updates: Partial<Pick<StudyProgram, 'name' | 'description' | 'startDate' | 'targetDate' | 'status'>>
  ): Promise<void> {
    const now = new Date().toISOString();
    const localKey = `${LOCAL_PROGRAMS_PREFIX}${ownerUid}`;
    const list = getLocalData<StudyProgram>(localKey);
    const index = list.findIndex((p) => p.id === programId && p.ownerUid === ownerUid);

    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...updates,
        updatedAt: now,
      };
      saveLocalData(localKey, list);
    }

    try {
      await updateDoc(doc(firestoreDb, 'programs', programId), {
        ...updates,
        updatedAt: now,
      });
    } catch (e) {
      console.warn('[ProgramService] updateProgram Firestore update fallback:', e);
    }
  },

  /**
   * Delete a program and cascade delete its subjects and chapters
   */
  async deleteProgram(programId: string, ownerUid: string): Promise<void> {
    // 1. Local update
    const progKey = `${LOCAL_PROGRAMS_PREFIX}${ownerUid}`;
    const subKey = `${LOCAL_SUBJECTS_PREFIX}${ownerUid}`;
    const chapKey = `${LOCAL_CHAPTERS_PREFIX}${ownerUid}`;

    const programs = getLocalData<StudyProgram>(progKey).filter((p) => p.id !== programId);
    const subjects = getLocalData<Subject>(subKey).filter((s) => s.programId !== programId);
    const chapters = getLocalData<Chapter>(chapKey).filter((c) => c.programId !== programId);

    saveLocalData(progKey, programs);
    saveLocalData(subKey, subjects);
    saveLocalData(chapKey, chapters);

    // 2. Firestore cascade delete
    try {
      await deleteDoc(doc(firestoreDb, 'programs', programId));

      // Query and delete subjects
      const subSnap = await getDocs(
        query(collection(firestoreDb, 'subjects'), where('programId', '==', programId))
      );
      for (const d of subSnap.docs) {
        await deleteDoc(d.ref);
      }

      // Query and delete chapters
      const chapSnap = await getDocs(
        query(collection(firestoreDb, 'chapters'), where('programId', '==', programId))
      );
      for (const d of chapSnap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (e) {
      console.warn('[ProgramService] deleteProgram Firestore cascade fallback:', e);
    }
  },

  /**
   * Archive / Unarchive program
   */
  async setProgramStatus(
    programId: string,
    ownerUid: string,
    status: ProgramStatus
  ): Promise<void> {
    await this.updateProgram(programId, ownerUid, { status });
  },

  // ==========================================
  // SUBJECT OPERATIONS
  // ==========================================

  /**
   * Subscribe to subjects of a specific program
   */
  subscribeSubjects(
    ownerUid: string,
    programId: string,
    onUpdate: (subjects: Subject[]) => void
  ): Unsubscribe {
    const localKey = `${LOCAL_SUBJECTS_PREFIX}${ownerUid}`;
    const allSubs = getLocalData<Subject>(localKey);
    const filtered = allSubs
      .filter((s) => s.programId === programId && s.ownerUid === ownerUid)
      .sort((a, b) => a.order - b.order);

    onUpdate(filtered);

    try {
      const q = query(
        collection(firestoreDb, 'subjects'),
        where('ownerUid', '==', ownerUid),
        where('programId', '==', programId)
      );

      return onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => d.data() as Subject);
            list.sort((a, b) => a.order - b.order);
            // Update local cache
            const others = getLocalData<Subject>(localKey).filter((s) => s.programId !== programId);
            saveLocalData(localKey, [...others, ...list]);
            onUpdate(list);
          }
        },
        (error) => {
          console.warn('[ProgramService] Subject listener error, fallback to cache:', error);
        }
      );
    } catch {
      return () => {};
    }
  },

  /**
   * Create a new Subject inside a Program
   */
  async createSubject(
    ownerUid: string,
    programId: string,
    data: { name: string; description?: string }
  ): Promise<Subject> {
    const now = new Date().toISOString();
    const localKey = `${LOCAL_SUBJECTS_PREFIX}${ownerUid}`;
    const existing = getLocalData<Subject>(localKey).filter((s) => s.programId === programId);
    const order = existing.length > 0 ? Math.max(...existing.map((s) => s.order)) + 1 : 1;

    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newSubject: Subject = {
      id,
      programId,
      ownerUid,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      order,
      createdAt: now,
      updatedAt: now,
    };

    // Save locally
    const all = getLocalData<Subject>(localKey);
    all.push(newSubject);
    saveLocalData(localKey, all);

    // Save to Firestore
    try {
      await setDoc(doc(firestoreDb, 'subjects', id), newSubject);
    } catch (e) {
      console.warn('[ProgramService] createSubject Firestore error:', e);
    }

    // Recalculate program summary
    await this.recalculateProgramSummary(programId, ownerUid);

    return newSubject;
  },

  /**
   * Edit Subject
   */
  async updateSubject(
    subjectId: string,
    programId: string,
    ownerUid: string,
    updates: Partial<Pick<Subject, 'name' | 'description' | 'order'>>
  ): Promise<void> {
    const now = new Date().toISOString();
    const localKey = `${LOCAL_SUBJECTS_PREFIX}${ownerUid}`;
    const all = getLocalData<Subject>(localKey);
    const index = all.findIndex((s) => s.id === subjectId && s.ownerUid === ownerUid);

    if (index !== -1) {
      all[index] = { ...all[index], ...updates, updatedAt: now };
      saveLocalData(localKey, all);
    }

    try {
      await updateDoc(doc(firestoreDb, 'subjects', subjectId), {
        ...updates,
        updatedAt: now,
      });
    } catch (e) {
      console.warn('[ProgramService] updateSubject Firestore error:', e);
    }
  },

  /**
   * Delete Subject and its associated chapters
   */
  async deleteSubject(
    subjectId: string,
    programId: string,
    ownerUid: string
  ): Promise<void> {
    const subKey = `${LOCAL_SUBJECTS_PREFIX}${ownerUid}`;
    const chapKey = `${LOCAL_CHAPTERS_PREFIX}${ownerUid}`;

    // Remove from local
    const subjects = getLocalData<Subject>(subKey).filter((s) => s.id !== subjectId);
    const chapters = getLocalData<Chapter>(chapKey).filter((c) => c.subjectId !== subjectId);
    saveLocalData(subKey, subjects);
    saveLocalData(chapKey, chapters);

    // Remove from Firestore
    try {
      await deleteDoc(doc(firestoreDb, 'subjects', subjectId));
      const chapSnap = await getDocs(
        query(collection(firestoreDb, 'chapters'), where('subjectId', '==', subjectId))
      );
      for (const d of chapSnap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (e) {
      console.warn('[ProgramService] deleteSubject Firestore error:', e);
    }

    // Recalculate program counts
    await this.recalculateProgramSummary(programId, ownerUid);
  },

  /**
   * Reorder Subjects within a program
   */
  async reorderSubjects(
    ownerUid: string,
    programId: string,
    orderedSubjectIds: string[]
  ): Promise<void> {
    const localKey = `${LOCAL_SUBJECTS_PREFIX}${ownerUid}`;
    const all = getLocalData<Subject>(localKey);

    orderedSubjectIds.forEach((id, idx) => {
      const s = all.find((item) => item.id === id);
      if (s) {
        s.order = idx + 1;
        s.updatedAt = new Date().toISOString();
      }
    });

    saveLocalData(localKey, all);

    try {
      const batch = writeBatch(firestoreDb);
      orderedSubjectIds.forEach((id, idx) => {
        batch.update(doc(firestoreDb, 'subjects', id), {
          order: idx + 1,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    } catch (e) {
      console.warn('[ProgramService] reorderSubjects Firestore batch error:', e);
    }
  },

  // ==========================================
  // CHAPTER OPERATIONS
  // ==========================================

  /**
   * Subscribe to chapters for a program
   */
  subscribeChapters(
    ownerUid: string,
    programId: string,
    onUpdate: (chapters: Chapter[]) => void
  ): Unsubscribe {
    const localKey = `${LOCAL_CHAPTERS_PREFIX}${ownerUid}`;
    const allChaps = getLocalData<Chapter>(localKey);
    const filtered = allChaps
      .filter((c) => c.programId === programId && c.ownerUid === ownerUid)
      .sort((a, b) => a.order - b.order);

    onUpdate(filtered);

    try {
      const q = query(
        collection(firestoreDb, 'chapters'),
        where('ownerUid', '==', ownerUid),
        where('programId', '==', programId)
      );

      return onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => d.data() as Chapter);
            list.sort((a, b) => a.order - b.order);
            const others = getLocalData<Chapter>(localKey).filter((c) => c.programId !== programId);
            saveLocalData(localKey, [...others, ...list]);
            onUpdate(list);
          }
        },
        (error) => {
          console.warn('[ProgramService] Chapter listener error, fallback to cache:', error);
        }
      );
    } catch {
      return () => {};
    }
  },

  /**
   * Create Chapter
   */
  async createChapter(
    ownerUid: string,
    programId: string,
    subjectId: string,
    data: {
      name: string;
      description?: string;
      estimatedMinutes?: number;
      actualMinutes?: number;
      targetDate?: string;
      status?: ChapterStatus;
    }
  ): Promise<Chapter> {
    const now = new Date().toISOString();
    const localKey = `${LOCAL_CHAPTERS_PREFIX}${ownerUid}`;
    const existing = getLocalData<Chapter>(localKey).filter((c) => c.subjectId === subjectId);
    const order = existing.length > 0 ? Math.max(...existing.map((c) => c.order)) + 1 : 1;

    const id = `chap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const status = data.status || 'not_started';

    const newChapter: Chapter = {
      id,
      programId,
      subjectId,
      ownerUid,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      order,
      status,
      targetDate: data.targetDate || '',
      estimatedMinutes: Number(data.estimatedMinutes) || 60,
      actualMinutes: Number(data.actualMinutes) || 0,
      completedAt: status === 'completed' ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    // Save locally
    const all = getLocalData<Chapter>(localKey);
    all.push(newChapter);
    saveLocalData(localKey, all);

    // Save to Firestore
    try {
      await setDoc(doc(firestoreDb, 'chapters', id), newChapter);
    } catch (e) {
      console.warn('[ProgramService] createChapter Firestore error:', e);
    }

    // Recalculate program summary
    await this.recalculateProgramSummary(programId, ownerUid);

    return newChapter;
  },

  /**
   * Update Chapter
   */
  async updateChapter(
    chapterId: string,
    programId: string,
    ownerUid: string,
    updates: Partial<Pick<Chapter, 'name' | 'description' | 'order' | 'status' | 'targetDate' | 'estimatedMinutes' | 'actualMinutes' | 'subjectId'>>
  ): Promise<void> {
    const now = new Date().toISOString();
    const localKey = `${LOCAL_CHAPTERS_PREFIX}${ownerUid}`;
    const all = getLocalData<Chapter>(localKey);
    const index = all.findIndex((c) => c.id === chapterId && c.ownerUid === ownerUid);

    const docUpdates: any = { ...updates, updatedAt: now };

    if (updates.status) {
      if (updates.status === 'completed') {
        docUpdates.completedAt = now;
      } else {
        docUpdates.completedAt = null;
      }
    }

    if (index !== -1) {
      all[index] = { ...all[index], ...docUpdates };
      saveLocalData(localKey, all);
    }

    try {
      await updateDoc(doc(firestoreDb, 'chapters', chapterId), docUpdates);
    } catch (e) {
      console.warn('[ProgramService] updateChapter Firestore error:', e);
    }

    // Always recalculate program progress & completed count
    await this.recalculateProgramSummary(programId, ownerUid);
  },

  /**
   * Delete Chapter
   */
  async deleteChapter(
    chapterId: string,
    programId: string,
    ownerUid: string
  ): Promise<void> {
    const localKey = `${LOCAL_CHAPTERS_PREFIX}${ownerUid}`;
    const all = getLocalData<Chapter>(localKey).filter((c) => c.id !== chapterId);
    saveLocalData(localKey, all);

    try {
      await deleteDoc(doc(firestoreDb, 'chapters', chapterId));
    } catch (e) {
      console.warn('[ProgramService] deleteChapter Firestore error:', e);
    }

    await this.recalculateProgramSummary(programId, ownerUid);
  },

  /**
   * Reorder Chapters within a subject
   */
  async reorderChapters(
    ownerUid: string,
    subjectId: string,
    orderedChapterIds: string[]
  ): Promise<void> {
    const localKey = `${LOCAL_CHAPTERS_PREFIX}${ownerUid}`;
    const all = getLocalData<Chapter>(localKey);

    orderedChapterIds.forEach((id, idx) => {
      const c = all.find((item) => item.id === id);
      if (c) {
        c.order = idx + 1;
        c.updatedAt = new Date().toISOString();
      }
    });

    saveLocalData(localKey, all);

    try {
      const batch = writeBatch(firestoreDb);
      orderedChapterIds.forEach((id, idx) => {
        batch.update(doc(firestoreDb, 'chapters', id), {
          order: idx + 1,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    } catch (e) {
      console.warn('[ProgramService] reorderChapters Firestore batch error:', e);
    }
  },

  /**
   * Change chapter status and immediately update program completion and scoring engine
   */
  async setChapterStatus(
    chapterId: string,
    programId: string,
    ownerUid: string,
    status: ChapterStatus
  ): Promise<any> {
    if (status === 'completed') {
      const scoringResult = await scoringService.completeChapter(ownerUid, chapterId, programId);
      // Synchronize local cache
      const localKey = `${LOCAL_CHAPTERS_PREFIX}${ownerUid}`;
      const all = getLocalData<Chapter>(localKey);
      const idx = all.findIndex((c) => c.id === chapterId);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          status: 'completed',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        saveLocalData(localKey, all);
      }
      await this.recalculateProgramSummary(programId, ownerUid);
      return scoringResult;
    } else {
      await scoringService.uncompleteChapter(ownerUid, chapterId, programId);
      await this.updateChapter(chapterId, programId, ownerUid, { status });
      return null;
    }
  },

  // ==========================================
  // PROGRESS & SUMMARY COMPUTATION
  // ==========================================

  /**
   * Automatically calculate:
   * - completed chapters
   * - total chapters
   * - total subjects
   * - progress percentage
   * When a chapter changes status, the program summary updates automatically.
   */
  async recalculateProgramSummary(
    programId: string,
    ownerUid: string
  ): Promise<{
    totalSubjects: number;
    totalChapters: number;
    completedChapters: number;
    progressPercentage: number;
  }> {
    const subKey = `${LOCAL_SUBJECTS_PREFIX}${ownerUid}`;
    const chapKey = `${LOCAL_CHAPTERS_PREFIX}${ownerUid}`;

    const subjects = getLocalData<Subject>(subKey).filter(
      (s) => s.programId === programId && s.ownerUid === ownerUid
    );
    const chapters = getLocalData<Chapter>(chapKey).filter(
      (c) => c.programId === programId && c.ownerUid === ownerUid
    );

    const totalSubjects = subjects.length;
    const totalChapters = chapters.length;
    const completedChapters = chapters.filter((c) => c.status === 'completed').length;
    const progressPercentage =
      totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    const summary = {
      totalSubjects,
      totalChapters,
      completedChapters,
      progressPercentage,
      updatedAt: new Date().toISOString(),
    };

    // Update local program
    const progKey = `${LOCAL_PROGRAMS_PREFIX}${ownerUid}`;
    const programs = getLocalData<StudyProgram>(progKey);
    const pIndex = programs.findIndex((p) => p.id === programId);
    if (pIndex !== -1) {
      programs[pIndex] = {
        ...programs[pIndex],
        ...summary,
        status:
          progressPercentage === 100 && totalChapters > 0
            ? 'completed'
            : programs[pIndex].status === 'completed' && progressPercentage < 100
            ? 'active'
            : programs[pIndex].status,
      };
      saveLocalData(progKey, programs);
    }

    // Update Firestore
    try {
      await updateDoc(doc(firestoreDb, 'programs', programId), summary);
    } catch (e) {
      console.warn('[ProgramService] recalculateProgramSummary Firestore error:', e);
    }

    return summary;
  },

  /**
   * Helper to calculate pace status
   * 'On Track' | 'Behind Pace' | 'Ahead of Schedule' | 'Completed' | 'Not Started'
   */
  getPaceStatus(program: StudyProgram): {
    label: 'On Track' | 'Behind Pace' | 'Ahead of Schedule' | 'Completed' | 'No Deadline';
    variant: 'success' | 'warning' | 'danger' | 'secondary';
    description: string;
  } {
    if (program.status === 'completed' || program.progressPercentage === 100) {
      return {
        label: 'Completed',
        variant: 'success',
        description: 'All chapters completed!',
      };
    }

    if (!program.targetDate) {
      return {
        label: 'No Deadline',
        variant: 'secondary',
        description: 'Self-paced track with no target deadline.',
      };
    }

    const start = new Date(program.startDate || program.createdAt).getTime();
    const target = new Date(program.targetDate).getTime();
    const now = Date.now();

    if (now > target) {
      return {
        label: 'Behind Pace',
        variant: 'danger',
        description: 'Past target completion date.',
      };
    }

    const totalDuration = target - start;
    const elapsed = now - start;
    if (totalDuration <= 0) {
      return {
        label: 'On Track',
        variant: 'success',
        description: 'On schedule.',
      };
    }

    const expectedProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
    const delta = program.progressPercentage - expectedProgress;

    if (delta >= 10) {
      return {
        label: 'Ahead of Schedule',
        variant: 'success',
        description: `${delta}% ahead of expected schedule.`,
      };
    } else if (delta < -15) {
      return {
        label: 'Behind Pace',
        variant: 'warning',
        description: `${Math.abs(delta)}% behind expected pacing.`,
      };
    }

    return {
      label: 'On Track',
      variant: 'success',
      description: 'Progress matches target timeline.',
    };
  },
};
