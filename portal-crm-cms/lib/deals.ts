export type Stage = "New" | "Contacted" | "Proposal" | "Won" | "Lost";
export type Deal = { id: string; company: string; contact: string; email: string; stage: Stage; value: number; initials: string; color: string; date: string };
export const stages: Stage[] = ["New", "Contacted", "Proposal", "Won", "Lost"];
export const seedDeals: Deal[] = [
  { id: "d1", company: "Northline Ceramics", contact: "Mina Patel", email: "mina@northline.example", stage: "New", value: 4800, initials: "NC", color: "sand", date: "Today" },
  { id: "d2", company: "Goodkind Market", contact: "Eli Ross", email: "eli@goodkind.example", stage: "New", value: 3200, initials: "GM", color: "rose", date: "21 Oct" },
  { id: "d3", company: "Fieldnote Books", contact: "Rae Coleman", email: "rae@fieldnote.example", stage: "New", value: 7600, initials: "FB", color: "blue", date: "20 Oct" },
  { id: "d4", company: "Juniper House", contact: "Sana Malik", email: "sana@juniper.example", stage: "Contacted", value: 5400, initials: "JH", color: "mint", date: "19 Oct" },
  { id: "d5", company: "Morrow Works", contact: "Jules Ford", email: "jules@morrow.example", stage: "Contacted", value: 4100, initials: "MW", color: "yellow", date: "18 Oct" },
  { id: "d6", company: "Stillwater Clinic", contact: "Noah Lee", email: "noah@stillwater.example", stage: "Contacted", value: 8900, initials: "SC", color: "blue", date: "17 Oct" },
  { id: "d7", company: "Pine & Parcel", contact: "Ivy Chen", email: "ivy@pineparcel.example", stage: "Proposal", value: 12500, initials: "PP", color: "rose", date: "16 Oct" },
  { id: "d8", company: "Local Current", contact: "Omar Hayes", email: "omar@localcurrent.example", stage: "Proposal", value: 6800, initials: "LC", color: "mint", date: "15 Oct" },
  { id: "d9", company: "Kinfolk Studio", contact: "Bea Martin", email: "bea@kinfolk.example", stage: "Proposal", value: 9400, initials: "KS", color: "sand", date: "14 Oct" },
  { id: "d10", company: "Common Ground", contact: "Theo Park", email: "theo@commonground.example", stage: "Won", value: 11200, initials: "CG", color: "yellow", date: "12 Oct" },
  { id: "d11", company: "Sunday Supply", contact: "Luca James", email: "luca@sunday.example", stage: "Won", value: 3900, initials: "SS", color: "rose", date: "10 Oct" },
  { id: "d12", company: "Westward Table", contact: "Uma Brooks", email: "uma@westward.example", stage: "Lost", value: 6200, initials: "WT", color: "blue", date: "08 Oct" },
];
