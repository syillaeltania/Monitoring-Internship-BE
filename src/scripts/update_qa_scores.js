import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const data = [
  { name: 'Mohamad Asyqari Anugrah', pre: 92, post: 98 },
  { name: 'Shalma Adelia', pre: 70, post: 84 },
  { name: 'Haddi Fauzan Nurrosid', pre: 94, post: 96 },
  { name: 'Ceri Dzakiyyah Nurrahman', pre: 84, post: 84 },
  { name: 'Aji Satrio Raharjo', pre: 90, post: 84 },
  { name: 'Riko', pre: 94, post: 98 },
  { name: 'Reva Kevina Jerry Nasir', pre: 94, post: 94 },
  { name: 'Divee Ananda Damarjati', pre: 88, post: 94 },
  { name: 'Ariq Athallah', pre: 90, post: 96 },
  { name: 'Fikri Wilya Pratama', pre: 94, post: 98 },
  { name: 'Muhd. Esa Aksara Pratama', pre: 94, post: 96 },
  { name: 'Bintang Suhel', pre: 92, post: 98 },
  { name: 'Gina', pre: 82, post: 92 },
  { name: 'Nahla', pre: 34, post: 96 },
  { name: 'Muhammad Ridwan', pre: 90, post: 94 },
  { name: 'Alfia April Riani', pre: 88, post: 92 },
  { name: 'Silvia Marta Kirana', pre: 86, post: 92 },
  { name: 'Azhar Adriyan Hasibuan', pre: 76, post: 92 },
  { name: 'Restu Hadi Nugraha', pre: 94, post: 95 },
  { name: 'Hansen Pratama', pre: 88, post: 94 },
  { name: 'Muhammad Fadhli Fadilah', pre: 90, post: 94 },
  { name: 'Raihan Khairul Rochman', pre: 90, post: 98 },
  { name: 'Andiya Aufa Qhoirunisa', pre: 96, post: 92 },
  { name: 'Ardian Zahy Assyaaki', pre: 90, post: 94 },
  { name: 'Fairus Kamal Nafis', pre: 90, post: 98 },
  { name: 'Rakha Hilmy Sulistyo', pre: 74, post: 96 },
  { name: 'Muhammad Nawfal Al Dzaki', pre: 46, post: 90 },
  { name: 'Hanif Dinata', pre: 92, post: 94 },
  { name: 'Desya Yusalima', pre: 90, post: 98 },
  { name: 'Mai Tasa Wilia', pre: 96, post: 98 },
  { name: 'Fariz Tio', pre: 94, post: 98 },
  { name: 'Mutiara', pre: 80, post: 86 },
  { name: 'Rifqi', pre: 88, post: 98 },
  { name: 'Reihan Azi Firdaus', pre: 96, post: 94 },
  { name: 'Ardivan Nur Raihan Rahman', pre: 94, post: 96 },
  { name: 'Noval Muharom', pre: 92, post: 98 },
  { name: 'Najmi Shofwan Al-Azhar', pre: 78, post: 94 },
  { name: 'Muhammad Jahran', pre: 86, post: 90 },
  { name: 'Echara', pre: 90, post: 92 },
  { name: 'Aditya', pre: 78, post: 94 },
  { name: 'Muhammad Rafi Shidqi', pre: 88, post: 92 },
  { name: 'Muhammad Zufar Rasyid Ibrahim', pre: 92, post: 94 },
  { name: 'Nurul Fauziyah Arifin', pre: 94, post: 96 },
  { name: 'Fikran Mahdan Nuha', pre: 76, post: 92 },
  { name: 'Aigretta Maharani', pre: 80, post: 96 },
  { name: 'Banu Arief Muzaki', pre: 86, post: 92 },
  { name: 'Zen Naufal Jasyr', pre: 84, post: 90 },
  { name: 'Mochamad Faqih Faizal Soelaemar', pre: 96, post: 96 },
  { name: 'M Iqbal Saepul Bahri', pre: 92, post: null },
  { name: 'Hilarius Rysfi Adi Kurnia', pre: 92, post: 98 },
  { name: 'Ujang Ilham Nur Zamzam', pre: 96, post: 96 },
];

async function main() {
  let updated = 0;
  for (const item of data) {
    const qaSelfLearning = true; 
    
    const result = await prisma.intern.updateMany({
      where: {
        name: { contains: item.name, mode: 'insensitive' },
      },
      data: {
        qaSelfLearning,
        qaPretestScore: item.pre,
        qaPosttestScore: item.post,
      }
    });

    if (result.count > 0) {
      updated += result.count;
      console.log(`✅ Updated ${item.name}`);
    } else {
      console.log(`❌ Not found: ${item.name}`);
    }
  }
  console.log(`\n🎉 Successfully updated ${updated} interns.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
