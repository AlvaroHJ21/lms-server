import { Document, Model } from 'mongoose';

interface MonthData {
  month: string;
  count: number;
}

export async function generateLast12MonthsData<T extends Document>(
  model: Model<T>
): Promise<{ last12Months: MonthData[] }> {
  const last12Months: MonthData[] = [];

  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 1);

  for (let i = 11; i >= 0; i--) {
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const endDate = new Date(currentMonthEnd);
    const startDate = new Date(currentMonthStart);

    //Retrocede al mes anterior
    currentDate.setMonth(currentDate.getMonth() - 1);

    // const endDate = new Date(
    //   currentDate.getFullYear(),
    //   currentDate.getMonth(),
    //   currentDate.getDate() - i * 28
    // );

    // const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 28);

    const monthYear = endDate.toLocaleString('default', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const count = await model.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
    });

    last12Months.push({ month: monthYear, count });
  }

  return { last12Months };
}
