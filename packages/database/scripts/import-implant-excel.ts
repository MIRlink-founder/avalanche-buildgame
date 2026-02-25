import 'dotenv/config';
import * as XLSX from 'xlsx';
import { prisma } from '../src/client';

const EXPECTED_HEADERS = ['제조사', '브랜드', '사이즈', '사용안함'] as const;

type Row = Record<string, string | number | boolean | undefined>;

function parseUsedDisabled(value: unknown): 'ACTIVE' | 'INACTIVE' {
  if (value === true) return 'INACTIVE';
  if (typeof value === 'string' && value.toLowerCase() === 'true')
    return 'INACTIVE';
  return 'ACTIVE';
}

function getString(row: Row, key: string): string {
  const v = row[key];
  if (v == null) return '';
  return String(v).trim();
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error(
      '사용법: npx tsx scripts/import-implant-excel.ts <엑셀파일경로>',
    );
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath, { type: 'file', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Row>(sheet);

  if (rows.length === 0) {
    console.log('엑셀에 데이터 행이 없습니다.');
    return;
  }

  const firstRow = rows[0] as Row;
  const hasHeaders = EXPECTED_HEADERS.every((h) => firstRow[h] !== undefined);
  const dataRows = hasHeaders ? rows.slice(1) : rows;
  const keys = hasHeaders
    ? EXPECTED_HEADERS
    : (Object.keys(firstRow) as (keyof Row)[]);
  const colMap = hasHeaders
    ? {
        제조사: '제조사',
        브랜드: '브랜드',
        사이즈: '사이즈',
        사용안함: '사용안함',
      }
    : ({
        제조사: keys[0],
        브랜드: keys[1],
        사이즈: keys[2],
        사용안함: keys[3],
      } as Record<(typeof EXPECTED_HEADERS)[number], string>);

  const seen = new Set<string>();
  const manufacturerNames = new Set<string>();
  const brandKeys = new Set<string>();
  let createdItems = 0;
  let updatedItems = 0;

  for (const row of dataRows) {
    const manufacturerName = getString(row, colMap.제조사);
    const brandName = getString(row, colMap.브랜드);
    const size = getString(row, colMap.사이즈);
    const usedDisabled = parseUsedDisabled(row[colMap.사용안함]);

    if (!manufacturerName || !brandName || !size) continue;

    const rowKey = `${manufacturerName}|${brandName}|${size}`;
    if (seen.has(rowKey)) continue;
    seen.add(rowKey);

    const manufacturer = await prisma.manufacturer.upsert({
      where: { name: manufacturerName },
      create: { name: manufacturerName },
      update: {},
    });
    manufacturerNames.add(manufacturerName);

    const brand = await prisma.implantBrand.upsert({
      where: {
        manufacturerId_name: {
          manufacturerId: manufacturer.id,
          name: brandName,
        },
      },
      create: { manufacturerId: manufacturer.id, name: brandName },
      update: {},
    });
    brandKeys.add(`${manufacturerName}|${brandName}`);

    const existing = await prisma.implantItem.findUnique({
      where: { brandId_size: { brandId: brand.id, size } },
    });
    if (existing) {
      await prisma.implantItem.update({
        where: { id: existing.id },
        data: { status: usedDisabled },
      });
      updatedItems += 1;
    } else {
      await prisma.implantItem.create({
        data: { brandId: brand.id, size, status: usedDisabled },
      });
      createdItems += 1;
    }
  }

  console.log('임포트 완료.');
  console.log(
    `  제조사: ${manufacturerNames.size}건, 브랜드: ${brandKeys.size}건`,
  );
  console.log(`  품목: ${createdItems}건 신규, ${updatedItems}건 갱신`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
