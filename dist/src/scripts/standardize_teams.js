import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
function standardize(division, team, leader) {
    let d = division.trim().toUpperCase();
    let t = team.trim();
    let l = leader ? leader.trim() : '';
    // Clean empties
    if (t === '-')
        t = '';
    if (d === '-')
        d = '';
    // Swapped records and specific leader misplacements
    if (d === 'LOGISTIK' && t === 'Soleh') {
        d = 'CORE';
        t = 'LOGISTIK';
        l = 'Soleh';
    }
    if (d === 'TW' && t === '') {
        d = 'BUSDEV';
        t = 'TW';
    }
    if (d === 'MDS' && ['Arif Maulana', 'Hanif', 'Irvan'].includes(t)) {
        l = t;
        t = 'MDS';
        d = 'TELCO';
    }
    if (d === 'ALPRA' && t === 'Rangga') {
        l = t;
        t = 'ALPRA';
        d = 'CORE';
    }
    if (d === 'PR' && t === 'Rangga') {
        l = t;
        t = 'PR';
        d = 'CORE';
    }
    if (d === 'MKT' && t === 'Heri') {
        l = t;
        t = 'MKT';
        d = 'CORE';
    }
    if (d === 'WDS 3' && t === 'Indra') {
        l = t;
        t = 'WDS-3';
        d = 'NEW BUSINESS';
    }
    if (d === 'WDS 4' && t === 'Fitrian') {
        l = t;
        t = 'WDS-4';
        d = 'NEW BUSINESS';
    }
    if (d === 'DSA 1' && t === 'Alam') {
        l = t;
        t = 'DSA-1';
        d = 'TELCO';
    }
    if (d === 'MPIS' && t === 'Aditya') {
        l = t;
        t = 'MPIS';
        d = 'CORE';
    } // assuming core
    if (d === 'FINANCE' && t === '') {
        d = 'CORE';
        t = 'FINANCE';
    }
    if (d === 'RISTEK' && t === 'DAHO') {
        d = 'BUSDEV';
        t = 'RISTEK';
        l = 'DAHO';
    }
    if (d === 'NB1' && t === 'HAFIZ') {
        d = 'NEW BUSINESS';
        t = 'NB-1';
        l = 'Hafiz';
    }
    if (d === 'TELCO1' && t === 'FARID') {
        d = 'TELCO';
        t = 'TELCO-1';
        l = 'Farid';
    }
    // General Division normalization
    if (d === 'BUSDEV')
        d = 'BUSDEV';
    else if (d === 'TELCO' || d === 'TELCO1')
        d = 'TELCO';
    else if (d === 'NB' || d === 'NB1' || d === 'NEW BUSINESS')
        d = 'NEW BUSINESS';
    // General Team normalization
    if (d === 'BUSDEV') {
        if (t.toUpperCase() === 'AI DEV' || t.toUpperCase() === 'AI DEVELOPMENT')
            t = 'AI Development';
        if (t.toUpperCase() === 'RISTECH' || t.toUpperCase() === 'RISTEK')
            t = 'RISTEK';
    }
    if (d === 'CORE') {
        if (t.toUpperCase() === 'FIN')
            t = 'FINANCE';
        if (t.toUpperCase() === 'LOG' || t.toUpperCase() === 'LOGISTIC' || t.toUpperCase() === 'LOGISTIK')
            t = 'LOGISTIK';
    }
    if (d === 'MSOS') {
        if (t.toUpperCase() === 'DEVOPS & SYSADM' || t.toUpperCase() === 'DEVOPS')
            t = 'DEVOPS';
        if (t.toUpperCase() === 'MSO 2' || t.toUpperCase() === 'MSOS-2')
            t = 'MSO-2';
        if (t.toUpperCase() === 'MSO 4')
            t = 'MSO-4';
        if (t.toUpperCase() === 'MSO 5' || t.toUpperCase() === 'MSO-5')
            t = 'MSO-5';
        if (t.toUpperCase() === 'MSO 6' || t.toUpperCase() === 'MSO-6')
            t = 'MSO-6';
        if (t.toUpperCase() === 'SQ' || t.toUpperCase() === 'SOFTWARE QUALITY')
            t = 'SOFTWARE QUALITY';
        if (t.toUpperCase() === 'TATANG') {
            l = 'Tatang';
            t = '';
        }
    }
    if (d === 'NEW BUSINESS') {
        if (t.toUpperCase() === 'NB-3 (PGN BILIING)' || t.toUpperCase() === 'NB-3 (PGN BILLING)')
            t = 'NB-3 (PGN Billing)';
        if (t.toUpperCase() === 'NB-4 (PEGADAIAN)' || t.toUpperCase() === 'PEGADAIAN')
            t = 'NB-4 (Pegadaian)';
        if (t.toUpperCase() === 'ANINDYA') {
            l = 'Anindya';
            t = '';
        }
        if (t.toUpperCase() === 'PGN')
            t = 'NB-2 (PGN)';
    }
    if (d === 'TELCO') {
        if (t.toUpperCase() === 'TELCO')
            t = '';
    }
    if (d === 'ALPRA & HCM' && t === '') {
        d = 'CORE';
        t = 'ALPRA & HCM';
    }
    return { d, t, l };
}
async function main() {
    console.log('--- Standardizing Interns ---');
    const interns = await prisma.intern.findMany();
    for (const intern of interns) {
        const { d, t, l } = standardize(intern.division, intern.team, intern.leader || '');
        if (intern.division !== d || intern.team !== t || (intern.leader || '') !== l) {
            await prisma.intern.update({
                where: { id: intern.id },
                data: { division: d, team: t, leader: l }
            });
            console.log(`[Intern] ${intern.name}: ${intern.division}|${intern.team} -> ${d}|${t}`);
        }
    }
    console.log('--- Standardizing Plans ---');
    const plans = await prisma.internshipPlan.findMany();
    for (const plan of plans) {
        const { d, t, l } = standardize(plan.targetDivision, plan.targetTeam, plan.leader || '');
        if (plan.targetDivision !== d || plan.targetTeam !== t || (plan.leader || '') !== l) {
            await prisma.internshipPlan.update({
                where: { id: plan.id },
                data: { targetDivision: d, targetTeam: t, leader: l }
            });
            console.log(`[Plan] ${plan.name}: ${plan.targetDivision}|${plan.targetTeam} -> ${d}|${t}`);
        }
    }
    console.log('--- Standardizing Team Requirements ---');
    const reqs = await prisma.teamRequirement.findMany();
    for (const req of reqs) {
        const { d, t, l } = standardize(req.division, req.team, req.leader || '');
        if (req.division !== d || req.team !== t) {
            // Check if target already exists
            const existing = await prisma.teamRequirement.findUnique({
                where: { division_team: { division: d, team: t } }
            });
            if (existing) {
                // Merge notes and candidate, then delete old
                await prisma.teamRequirement.update({
                    where: { id: existing.id },
                    data: {
                        notes: existing.notes ? existing.notes + (req.notes ? '\n' + req.notes : '') : req.notes,
                        replacementCandidate: existing.replacementCandidate ? existing.replacementCandidate + (req.replacementCandidate ? '\n' + req.replacementCandidate : '') : req.replacementCandidate,
                    }
                });
                await prisma.teamRequirement.delete({ where: { id: req.id } });
                console.log(`[TeamReq] Merged ${req.division}|${req.team} into ${d}|${t} and deleted old`);
            }
            else {
                await prisma.teamRequirement.update({
                    where: { id: req.id },
                    data: { division: d, team: t, leader: l }
                });
                console.log(`[TeamReq] Updated ${req.division}|${req.team} -> ${d}|${t}`);
            }
        }
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=standardize_teams.js.map