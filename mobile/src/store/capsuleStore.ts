type Capsule = {
  id: string;
  title: string;
  openDate: string;
  isLocked: boolean;
  images: number;
};

let capsules: Capsule[] = [
  { id: '1', title: 'Kỷ niệm nhóm tháng 6', openDate: '2026-12-31', isLocked: true, images: 3 },
  { id: '2', title: 'Ngày đầu tiên', openDate: '2026-06-04', isLocked: false, images: 5 },
  { id: '3', title: 'Mục tiêu 2027', openDate: '2027-01-01', isLocked: true, images: 1 },
];

export const capsuleStore = {
  getAll: () => capsules,

  add: (capsule: Omit<Capsule, 'id'>) => {
    const newCapsule = { ...capsule, id: Date.now().toString() };
    capsules = [...capsules, newCapsule];
    return newCapsule;
  },

  remove: (id: string) => {
    capsules = capsules.filter(c => c.id !== id);
  },
};