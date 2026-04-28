
const { createClient } = require('@supabase/supabase-js');

const SB_URL = "https://jmalxvhumgygqxqislut.supabase.co";
const SB_KEY = "sb_publishable_62y7dPN9SEc4U_8Lpu4ZNQ_H1PLDVv8";
const supabase = createClient(SB_URL, SB_KEY);

async function investigate() {
    const carNo = '43186';
    const startDate = '2026-04-01';
    const endDate = '2026-04-30';

    console.log(`Investigating car ${carNo} from ${startDate} to ${endDate}...`);

    const { data, error } = await supabase
        .from('t05_revenues')
        .select('*')
        .eq('f03_car_no', carNo)
        .gte('f02_date', startDate)
        .lte('f02_date', endDate);

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    console.log(`Found ${data.length} records:`);
    let total = 0;
    data.forEach((r, i) => {
        const amt = parseFloat(r.f06_amount || 0);
        total += amt;
        console.log(`${i+1}. Date: ${r.f02_date}, Amount: ${amt}, Category: ${r.f05_category}, Notes: ${r.f09_notes}`);
    });

    console.log(`Total Calculated: ${total}`);
    if (total === 220) {
        console.log("Confirmed: Total is 220. Let's see why it's not 150.");
    }
}

investigate();
