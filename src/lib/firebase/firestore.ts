import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import { User, Schedule, Task } from '@/types';

// コレクション名
const USERS_COLLECTION = 'users';
const SCHEDULES_COLLECTION = 'schedules';
const TASKS_COLLECTION = 'tasks';

// ユーザー情報の作成・更新
export const saveUser = async (userId: string, userData: Partial<User>) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const now = Timestamp.now();
    
    await setDoc(userRef, {
      ...userData,
      updatedAt: now,
      createdAt: userData.createdAt || now,
    }, { merge: true });
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};

// ユーザー情報の取得
export const getUser = async (userId: string) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { user: userSnap.data() as User, error: null };
    }
    return { user: null, error: new Error('User not found') };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

// スケジュールの作成
export const createSchedule = async (userId: string, scheduleData: Omit<Schedule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  try {
    console.log('createSchedule called with userId:', userId);
    console.log('scheduleData:', scheduleData);
    
    const schedulesRef = collection(db, SCHEDULES_COLLECTION);
    const newScheduleRef = doc(schedulesRef);
    const now = Timestamp.now();
    
    const schedule: Schedule = {
      ...scheduleData,
      id: newScheduleRef.id,
      userId,
      date: scheduleData.date,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
    
    const firestoreData = {
      ...schedule,
      date: Timestamp.fromDate(schedule.date),
      createdAt: now,
      updatedAt: now,
    };
    
    console.log('Saving to Firestore with id:', newScheduleRef.id);
    console.log('Firestore data:', firestoreData);
    
    await setDoc(newScheduleRef, firestoreData);
    
    console.log('Schedule saved successfully');
    
    return { schedule, error: null };
  } catch (error) {
    console.error('createSchedule error:', error);
    return { schedule: null, error: error as Error };
  }
};

// ユーザーのスケジュール一覧を取得
export const getSchedules = async (userId: string, startDate?: Date, endDate?: Date) => {
  try {
    console.log('getSchedules called');
    console.log('userId:', userId);
    console.log('startDate:', startDate);
    console.log('endDate:', endDate);
    
    const schedulesRef = collection(db, SCHEDULES_COLLECTION);
    
    // まずuserIdだけでクエリ
    const q = query(schedulesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    console.log('Query returned', querySnapshot.docs.length, 'documents');
    
    let schedules: Schedule[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Document data:', doc.id, data);
      return {
        ...data,
        id: doc.id,
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Schedule;
    });
    
    console.log('Parsed schedules:', schedules);
    
    // クライアント側で日付フィルタリング
    if (startDate || endDate) {
      schedules = schedules.filter(schedule => {
        const scheduleDate = schedule.date.getTime();
        const isAfterStart = !startDate || scheduleDate >= startDate.getTime();
        const isBeforeEnd = !endDate || scheduleDate <= endDate.getTime();
        return isAfterStart && isBeforeEnd;
      });
      console.log('After date filtering:', schedules.length, 'schedules');
    }
    
    // 日付でソート
    schedules.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return { schedules, error: null };
  } catch (error) {
    console.error('getSchedules error:', error);
    return { schedules: [], error: error as Error };
  }
};

// スケジュールの更新
export const updateSchedule = async (scheduleId: string, updates: Partial<Schedule>) => {
  try {
    const scheduleRef = doc(db, SCHEDULES_COLLECTION, scheduleId);
    const now = Timestamp.now();
    
    await updateDoc(scheduleRef, {
      ...updates,
      updatedAt: now,
    });
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};

// スケジュールの削除
export const deleteSchedule = async (scheduleId: string) => {
  try {
    const scheduleRef = doc(db, SCHEDULES_COLLECTION, scheduleId);
    await deleteDoc(scheduleRef);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};

// タスクの作成
export const createTask = async (userId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const newTaskRef = doc(tasksRef);
    const now = Timestamp.now();
    
    const task: Task = {
      ...taskData,
      id: newTaskRef.id,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
    
    await setDoc(newTaskRef, {
      ...task,
      scheduledDate: task.scheduledDate ? Timestamp.fromDate(task.scheduledDate) : null,
      createdAt: now,
      updatedAt: now,
    });
    
    return { task, error: null };
  } catch (error) {
    return { task: null, error: error as Error };
  }
};

// タスクの更新
export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const now = Timestamp.now();
    
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: now,
    });
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};

