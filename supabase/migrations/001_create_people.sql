-- People table mapped from BHP Meeting Dashboard Info.xlsx
-- Master sheet fields + Dropbox status sheet fields.

create extension if not exists pg_trgm;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'person_status') then
    create type public.person_status as enum ('new', 'active', 'inactive');
  end if;
end
$$;

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  starred boolean not null default false,
  name text not null,
  reference_number text,
  cv_url text,
  primary_residence text,
  passports text[] not null default '{}',
  preferred_locations text,
  notice_period text,
  maximum_duration text,
  most_recent_position text,
  previous_assignments text[] not null default '{}',
  years_as_gm text,
  specialty text,
  number_of_keys text,
  opening_experience text,
  capex_refurb_experience text,
  languages text[] not null default '{}',
  linkedin_url text,
  email text,
  phone text,
  personal_status text,
  blackout_dates text,
  enrolment_date text,
  notes text,
  status public.person_status not null default 'new',
  tier text,
  has_cv boolean,
  has_contract boolean,
  has_tracking boolean,
  has_references boolean,
  owner text,
  recruiter text,
  consultancy text,
  dropbox_comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists people_name_idx on public.people (name);
create index if not exists people_status_idx on public.people (status);
create index if not exists people_email_idx on public.people (email);
create index if not exists people_reference_number_idx on public.people (reference_number);
create index if not exists people_search_idx on public.people using gin (
  (
    coalesce(name, '') || ' ' ||
    coalesce(email, '') || ' ' ||
    coalesce(phone, '') || ' ' ||
    coalesce(reference_number, '') || ' ' ||
    coalesce(most_recent_position, '') || ' ' ||
    coalesce(primary_residence, '')
  ) gin_trgm_ops
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists people_set_updated_at on public.people;
create trigger people_set_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

alter table public.people enable row level security;

drop policy if exists "people_select_anon" on public.people;
drop policy if exists "people_insert_anon" on public.people;
drop policy if exists "people_update_anon" on public.people;
drop policy if exists "people_delete_anon" on public.people;

create policy "people_select_anon"
  on public.people for select
  to anon, authenticated
  using (true);

create policy "people_insert_anon"
  on public.people for insert
  to anon, authenticated
  with check (true);

create policy "people_update_anon"
  on public.people for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "people_delete_anon"
  on public.people for delete
  to anon, authenticated
  using (true);

grant usage on type public.person_status to anon, authenticated;
grant select, insert, update, delete on table public.people to anon, authenticated;

truncate table public.people;

insert into public.people (
  starred, name, reference_number, cv_url, primary_residence, passports, preferred_locations, notice_period, maximum_duration, most_recent_position, previous_assignments, years_as_gm, specialty, number_of_keys, opening_experience, capex_refurb_experience, languages, linkedin_url, email, phone, personal_status, blackout_dates, enrolment_date, notes, status, tier, has_cv, has_contract, has_tracking, has_references, owner, recruiter, consultancy, dropbox_comments
)
values
  (TRUE, 'Jordi Tarrida', '2', NULL, 'Spain', ARRAY['German']::text[], 'Flexible, excluding Aftica', '2 weeks', 'Flexible', 'GM Mondrian & Hyde, Ibiza', ARRAY['Dir Opertaions Spain, Hamilton Pyyramid', 'GM Jumeirah Port Soller', 'GM Turnberry Golf Resort']::text[], '25', 'Resort | City', '550', '2 Opening | 2 Reopening', '70 Mio (?)', ARRAY['English', 'German', 'Spanish']::text[], 'https://www.linkedin.com/in/jordi-e-tarrida', 'jetarrida@gmail.com', '34649880631', 'Married', 'N/A', NULL, 'Starwood colleague of jk | Spanish unemployment regulaions - jk can explain. Ideally posting in Spain!', 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JK', 'Direct', NULL, NULL),
  (TRUE, 'Thomas Lind', '3', NULL, 'US', ARRAY['US', 'Swedish']::text[], 'Open', '2 weeks', 'Open', 'MD &VP , Ava Resort Cancun', ARRAY['MD &VP , Ava Resort Cancun', 'GM, Avalon Atlanta', 'SVP Leela Hotels, India']::text[], '25', 'Resorts | City | Residential | Pre-opening', '250-1600', '7', '$ 50-350 mill', ARRAY['English', 'Spanish', 'Swedish']::text[], 'https://www.linkedin.com/in/thomas-lind-b5657b2a/', 'thomasljlind@mac.com', '18474201187', 'Married', 'None', NULL, 'When in Riyad reporting to Andrew H', 'active', 'B', TRUE, TRUE, TRUE, TRUE, 'JK/JC', 'Direct', NULL, NULL),
  (TRUE, 'Martin Jones', '4', NULL, 'Switzerland | Malasyia', ARRAY['UK', 'Australia']::text[], 'Globally except ME & China', '4 weeks', 'Unlimited', 'Global Head F&B, IHG Luxry', ARRAY['VP F&B Europe, Accor Luxury', 'VP F&B APAC, Starwood', 'GM Westin KL', 'GM W Seoul']::text[], '10', 'City | Resort | Convention | Airport', '2100', '4 as GM', NULL, ARRAY['English']::text[], 'martibjones', 'martin.jones@pobox.com', '41799013008', 'Single', 'None', NULL, 'F&B apac Starwood when jk GM Sheraton Phuket', 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JK', 'MNP', NULL, 'F&B Specialist'),
  (TRUE, 'Michel Serrano', '5', NULL, 'Thailand', ARRAY['France']::text[], 'Gobally exc. Africa & S Arabia', '4 weeks', '6 months', 'VP Asset / Operation', ARRAY['VP Ops / GM GCPH 2021-2024', 'VP Asset / GCPH EU 2018-2021', 'CEO Odyssea Hosp, Vietnam 2015 - 2017']::text[], '25', 'City', '1000', '5', '20', ARRAY['French', 'English', 'Spanish', 'Portuguese']::text[], 'yes', 'michelserrano888@gmail.com', 'TH 0806039609', 'Married', 'None', NULL, 'Worked at GCPH at the same time as jk', 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JK', 'Direct', NULL, NULL),
  (TRUE, 'Markus Lahannen', '6', NULL, 'Portugal', ARRAY['Finland, Spain']::text[], 'Europe, ME, Caribbean, Mexico', '2 weeks', '2 years', 'Cancun, Mexico', ARRAY['Managing Director Cancun,']::text[], '17', 'Resort', '100+', '6', '24M in Catalonia', ARRAY['English']::text[], 'www.linkedin.com/in/markuslaahanen', 'mlaahanen@me.com', '351926730675', 'Married', 'N/A', NULL, NULL, 'active', 'B', TRUE, TRUE, TRUE, TRUE, 'JC', 'Direct', NULL, NULL),
  (TRUE, 'Lucas Chanter', '7', NULL, 'Indonesia', ARRAY['Australian', 'Hong Kong Permanent Residency']::text[], 'Open, but prefer South east Asia | Would like to try the Middle East', '1 Month (negotiable)', 'Open', 'Director of Operations S.E.A - Ovolo Hotels', ARRAY['Director of Operations S.E.A - Ovolo Hotels', 'Director of Operations - GOCO Hospitality']::text[], '18', 'All-rounder', '40-650', '0', '3', ARRAY['English']::text[], 'linkedin.com/in/lucaschanter', 'lucas.chanter@yahoo.com.au', '+66654723693 | +85295927278', 'Available', 'N/A', '29 - July - 2025', NULL, 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JC', 'Direct', NULL, NULL),
  (TRUE, 'Edwin Kramer', '8', NULL, 'Spain', ARRAY['Dutch']::text[], 'Open', 'Open', 'Open', 'General Manager and Consultant | Maldives (2019-2021)', ARRAY['Ibiza, Barcelona, London', 'Director, A Kretschmann', 'Consultancy, Bangkok', 'GM/The Legian Bali', 'LVMH/ Maison Cheval Blanc']::text[], '8+ | 3 | 2 | 5', 'Both | Resort | Resorts', '100-200 | 67 | multiple | projects', 'Yes several | Yes', 'yes', ARRAY['Dutch English Spanish German']::text[], 'www.linkedin.com/in/edwinckramer', 'Edwin@kramerhospitality.com | 66614155425', '34647239493', NULL, NULL, NULL, 'VP role - overseeing The Legian Bali, The Legian Sire, Lombok', 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JC', 'Direct', NULL, NULL),
  (TRUE, 'Mete Atakuman', '11', NULL, 'Australia', ARRAY['Australia', 'Turkiye']::text[], 'Asia / South East Asia | Middle East | Eastern Europe', '14 days', '6 months', 'D7 Advisory & Consulting', ARRAY['Group & Cluster General Manager ( 2024 )', 'Group General Manager ( 2018 - 2023 )', 'General Manager ( 2011 - 2017 )']::text[], '15 +', 'City / Resort / Mixed Use | Independent & Lifestyle | All segments from upper midscale to Ultra Luxury', '500+ | with Extensve FB', '6', '7 + Projects', ARRAY['English ( Native )', 'Turkish ( Native )']::text[], 'www.linkedin.com/in/mete-atakuman-27ba9010/', 'meteatakuman@hotmail.com', '61401169393', 'Married', 'NA', '01.08.2025', NULL, 'new', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (TRUE, 'Beat Klarer', '12', NULL, 'Thailand', ARRAY['Switzerlan']::text[], 'South East Asia, China, Europe, ME', 'non', 'flexible', 'General Manager Anantasila Beach Resort Hua Hin, Thailand', ARRAY['GM Sofitel Berlin', 'GM Sofitel Manila', 'GM Sofitel Guangzhou']::text[], '23', 'City & Resorts', '98-600', 'yes', 'yes', ARRAY['E, D, F, IT, Sp']::text[], 'https://www.linkedin.com/in/beat-klarer-2826228/', 'beat.kl@gmail.com', '66952476869', 'married', 'none', '2025-07-30', NULL, 'active', 'B', TRUE, TRUE, TRUE, TRUE, 'JK', 'Direct', NULL, NULL),
  (TRUE, 'Neils Sherry', '13', NULL, 'UK', ARRAY['UK']::text[], 'Any', 'Case by case', 'Case by case', 'Founder, Cultural Hospitality', ARRAY['Consulting']::text[], 'Since 1999', 'Resort, City, Boutique', '289', 'Yes', 'Yes', ARRAY['English']::text[], 'https://www.linkedin.com/in/niels-sherry/', 'nielssherry@btinternet.com', '44 (0) 7825746735', NULL, 'TBA', '2025-07-29', NULL, 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JC', 'Direct', NULL, NULL),
  (TRUE, 'York Brandes', '14', NULL, 'UAE / Cyprus', ARRAY['German']::text[], 'EU / ME / Asia', 'at present 2 month', '3 month', 'Director New communities/ openings at ALDAR Estate', ARRAY['1. Opening GM Ritz Carlton Residences Limassol, Cyprus. 2. Opening GM Parklane, LC, Limassol, 3. VP operations for GHM in Singapore.']::text[], '25', 'Resort/ Villas/ Resi', 'up to 400', 'Yes', 'yes', ARRAY['German / English']::text[], 'www.linkedin.com/in/york-brandes-71b0ab10', 'yorkbrandes@gmail.com', '+971504311951', 'Married', 'N/A', NULL, 'Lets confirm in January 2026 my availability', 'inactive', 'A', TRUE, TRUE, TRUE, TRUE, 'JC', 'Belinda', NULL, 'Available Jan 2026'),
  (TRUE, 'Christain Palacin', '15', NULL, 'France', ARRAY['French']::text[], 'Open to any location Europe, Middle East, Asia', '2 weeks', 'Open', 'Royal Rose Abu Dhabi ( Curio Collection by Hilton )', ARRAY['Millennium Hotels UAE']::text[], '25', 'Resorts and Business / City / Luxury Hotels', 'Up to 350', 'yes involved in pre-opening for 8 properties 4 properties as GM', 'Yes', ARRAY['French ( Mother Tongue )']::text[], 'https://www.linkedin.com/in/christianpalacin', 'cpalacin@hotmail.fr', '33680740718', 'Available', 'August 10 th to 28 th', NULL, NULL, 'active', 'B', TRUE, TRUE, TRUE, TRUE, 'JC', 'Direct', NULL, NULL),
  (FALSE, 'Ralf Stresing', '16', NULL, 'Germany', ARRAY['C5R95T07H']::text[], 'Europe & Asia', '1 Week', '6 Months', 'Multi-Property General Manager', ARRAY['Multi-Property General Manager Sheraton & Marriott Frankfurt Airport, Germany', 'Opening General Manager Le Meridien Bangkok, Thailand', 'General Manager Le Royal Meridien Baan Taling Ngam Koh Samui, Thailand']::text[], '20', 'Resort Asia | Residential & Villa Asia | City Europe & Asia | Airport Germany', '220 | 80 | 200-641 | 1017', 'Yes', 'Yes', ARRAY['German', 'English']::text[], 'www.linkedin.com/in/ralf-stresing-80080a3b', 'ralfstresing@gmail.com', '49 - 1733488403', 'Married', 'No', NULL, 'Owner expectations and clear briefing is vital prior excepting postings', 'active', 'B', TRUE, TRUE, TRUE, TRUE, 'JK', 'Direct', NULL, NULL),
  (TRUE, 'Richard Lyon', '17', NULL, 'UK', ARRAY['UK & s African']::text[], NULL, '4 weeks max', '6 months', 'One & Only Cape Town', ARRAY['C Town, St. Lucia, Mumbai']::text[], '20', 'City & Resort', '120 - 530', 'Budapest & St. Lucia', 'Various', ARRAY['English']::text[], NULL, 'jrichardlyon@gmail.com', '447565447417', 'Divorced', 'Oct 20 - Dec 10, 2025', NULL, NULL, 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JK', 'Direct', 'y', NULL),
  (TRUE, 'Tom Krooswijk', '18', NULL, 'Paris, France', ARRAY['dutch']::text[], 'Europe', NULL, NULL, 'Transition GM Amstel Hotel Amsterdam', ARRAY['Transition GM Carlton Regent, Cannes', 'Transition GM Amster=l Hotel, Amsterdam']::text[], NULL, 'allround | Golfclubs', 'up 500', '17', '24', ARRAY['Dutch, French, English German']::text[], NULL, 'tjkrooswijk@gmai.com', 'mail.com | 33 6 84 98 54 64', NULL, NULL, NULL, NULL, 'active', 'A', TRUE, TRUE, TRUE, FALSE, 'JK', 'Direct', NULL, NULL),
  (FALSE, 'Joachim Schutte', '19', NULL, 'Switzerland until August 2026 | Germany from August 2025 onwards', ARRAY['German Passport', 'C4YLJXLKW']::text[], 'Preferred Location: Europe, Asia, ME, Maldives', '2 weeks', '6 month | TBA', 'Director of Operation, Glion', ARRAY['Director of Operation, Glion', 'Managing Director, EHL', 'General Manager, Dusit Thani']::text[], '10 Jahre', 'High End Resorts, | also City Hotel experiences', 'from 100 to 500', 'Yes, also to | mention, | Many Project | under', 'New Openings, | large renovation | in different | properties', ARRAY['German, Mothertongue', 'English, good']::text[], '(7) Joachim Schütte | LinkedIn', 'joachim_schutte@yahoo.com', 'German +4917638842502 | Swiss +41766166229', 'available', 'none', '2025-08-21', 'I am checking the contact details of my references and will | provide the details once confirmed.', 'active', 'B', TRUE, TRUE, TRUE, TRUE, 'JK', 'Direct', NULL, NULL),
  (FALSE, 'Gregory De Clerck', '20', NULL, 'Spain', ARRAY['Belgium', 'ES702290']::text[], 'Exlcusion : Morocco, Algeria, Tunesia', '3 months', 'flexible', 'General Manager Great Scotland Yard', ARRAY['General Manager The Ritz Carlton Abama', 'Multi property General Manager', 'Area General Manager Starwood indian ocean']::text[], '20', 'Resort | City', 'From 151 to 460 single property', '5 hotels', 'Yes, 20 million', ARRAY['English', 'Spanish', 'French', 'Dutch']::text[], 'www.linkedin.com/in/gregorydeclerck', 'gdeclerck68@gmail.com', '34659184892', 'Married', '2025', NULL, NULL, 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JK', 'Belinda', NULL, 'Available Q1 2026'),
  (FALSE, 'Adrian Ellis', '21', NULL, 'England', ARRAY['British']::text[], 'No exclusions', '2 weeks', 'Ideally 3 months', 'GM at The Lowry Hotel, Manchester', ARRAY['GM at Fairmont Bali, GM at Fairmont Baku and GM at Corinthia Hotel Budaoest']::text[], '34 Years', 'City Centre Locations', 'Ranging from 150 to 450', 'Hotels in Norwich and Fairmont Baku', 'Refurb of Le Meridien Manchester, Le Meridien Warsaw and The Lowry Hotel in Manchester', ARRAY['English and basic understanding of German']::text[], 'Adrian Ellis MI FIH', 'adrian.ellis@ellishospitality.co.uk', '07967107597', 'Married', 'February 2026 as we already have a cruise booked', NULL, NULL, 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JC', 'Belinda', NULL, NULL),
  (FALSE, 'Hugo Gerritsen', '22', NULL, 'Malaysia', ARRAY['Dutch (NYR99D1B3)']::text[], 'N/A', 'N/A', 'N/A', 'Pre-opening GM Radisson Hotel Phuket Kata', ARRAY['1. Pre-opening GM Radisson Hotel Phuket Kata, 2. City GM BH&R. 3 Area General Manager, @Agora Hospitality Group (Osaka)']::text[], '12', 'All rounded', 'from 220 to 660', 'Over the course of my 35-year career, I have been involved in seven pre-openings in various capacities, including two as General Manager.', 'Over the course of my 35-year career, I have been involved in numerous hotel renovation projects ranging from USD 1 million to USD 11 million, with the largest being a USD 35 million full renovation of the Sheraton Kampala. This project required coordination with consultants and contractors from multiple countries. In my most recent role at Radisson, in the absence of a project director from the owning investment company, my responsibilities extended well beyond those of a typical pre-opening General Manager.', ARRAY['Dutch and English, with working capability in German and French (to a lesser extent).']::text[], 'https://www.linkedin.com/in/hugo-gerritsen-3968b010/', 'hugogerritsen@yahoo.com', '0060-10-2791612', 'Married (No Kids)', 'N/A', '2025-10-01', NULL, 'active', 'B*', TRUE, TRUE, TRUE, NULL, 'JK', 'Direct', NULL, '*Finance speciaist'),
  (FALSE, 'Diksha Singh', '23', NULL, 'Abu Dhabi, UAE', ARRAY['Indian']::text[], 'Middle East, Asia', 'Available Immediate', 'Can be discussed', 'General Manager Grand Hyatt Abu Dhabi', ARRAY['GM, Area HR with Hyatt', 'Director operations - Malliouhana']::text[], '5', 'MICE/ Resort', '468', '20', 'yes | refurb projects', ARRAY['English, A 1 German']::text[], 'https://www.linkedin.com/in/diksha-singh-45b35963/', 'dikshasingh.ds.work@gmail.com', '_+971508234817', 'Single', 'Can be discussed', NULL, NULL, 'active', 'B', TRUE, TRUE, TRUE, TRUE, 'JK', 'Belinda', NULL, NULL),
  (FALSE, 'Martijn Mulder', '25', NULL, 'United Kingdom', ARRAY['NL']::text[], 'London + NL', 'Currently directly available', 'TBA', 'Managing Director The Mandrake', ARRAY['General Manager W London Leicester Square / Hotel Manager Aloft London / Area DOSM Munich Starwood Hotels & Resorts']::text[], '9+ year''s', 'City hotels', '35 - 1000', 'yes, Sheraton Bratislava + Sheraton Prague + Aloft Munich', 'W London full hotel refurb (Rooms + B&F) + Acquisition of an adjacent building at The Mandrake 800 sqm Spa and Private Membersclub', ARRAY['Dutch Native English Fluent German Fluent Slovak. Elementary']::text[], 'https://www.linkedin.com/in/martijn-mulder-0073125/', 'martijnnmulder@gmail.com', '447920543720', 'Married', 'NA', '2025-09-24', 'Pre-Opening & Opening Expertise: Extensive experience leading hotel and restaurant pre-opening phases through to successful openings, including team recruitment, training, operational set-up, and launch execution. Development & Acquisition: Proven track record in evaluating, negotiating, and executing development and acquisition opportunities to expand brand portfolios. Rebranding Projects: Directed major brand transitions, including repositioning Le Méridien to The Luxury Collection and Kempinski to The Luxury Collection, ensuring seamless operational, cultural, and brand alignment. Contract Structures: In-depth experience working with diverse hotel management models, including Owned, Managed, Franchise, and Independent agreements, with strong ability to adapt strategies to each framework.', 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JK', 'Direct', NULL, NULL),
  (FALSE, 'Ferghal Purcell', '26', NULL, 'UAE', ARRAY['Irish']::text[], 'Middle East / Asia', 'None', 'None', 'GM - QE2 Hotel - Dubai', ARRAY['Not assigned yet']::text[], '30+', '5* + Golf Resorts', '450', 'Yes', 'Yes', ARRAY['English']::text[], 'Ferghal Purcell', 'ferghalpurcell@gmail.com', '564097077', 'M', 'none', '25.09.2025', NULL, 'active', 'A', TRUE, TRUE, TRUE, NULL, 'JC', 'MNP', NULL, NULL),
  (FALSE, 'Alex Gassauer', '27', NULL, 'Austria', ARRAY['Austria']::text[], 'Exclusion:Algeria', 'none', '12 months', 'Owner, CEO', ARRAY['Operator CIC Alger', 'Sheraton Tunis']::text[], '35', 'Resort and City', '450 +', 'Yes', 'Yes', ARRAY['English']::text[], 'Alexander Gassauer', 'alexander.gassauer@gmail.com', '43676961440', 'married', 'none', NULL, NULL, 'active', 'B', TRUE, TRUE, TRUE, TRUE, 'JK', 'Direct', NULL, NULL),
  (FALSE, 'Patrick De Groot', '30', NULL, 'Netherlands', ARRAY['Dutch']::text[], 'n/a', '1 week', 'open', 'Managing Partner', ARRAY['Chief Operating Officer - Hospitality - Orbys BV']::text[], '18', 'ultra-luxury to upper-midscale', '450', 'yes', 'yes', ARRAY['English']::text[], 'https://www.linkedin.com/in/patrickdegroot2712/', 'patrick@consideredco.nl', '31682577110', 'married', 'none', '2025-10-09', NULL, 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JC', 'Direct', NULL, NULL),
  (FALSE, 'Stig Castoe', '31', NULL, 'France', ARRAY['Danish']::text[], 'Open', 'Avl from end December 2025', 'open', 'Interim 7 mth from June to Dec 2025 at H4 Hotel Wyndham Pleyel Paris', ARRAY['MD Hotel Ullensvang Norway 3 years- MD Concor Golf 1 year, Interim GM Hilton Mazatlan Mexico 1 year']::text[], '30 years incl Area MD 10 years', 'All', 'from Adria boutique hotel London, to 700 Rooms 10.000M2 Conference Hotel, for H4 Wyndham Pleyel Paris', 'as Area MD', 'Hotel des Indes Den Haag, close down and reopen as Area MD', ARRAY['English, Danish, French, German, Dutch, Norwegian, Swedish']::text[], 'https://www.linkedin.com/in/stig-castoe-cast%C3%B8e-58a78431/', 'stig.castoe@gmail.com', '33689254892', 'In relationship and twnonebo children born 2004, 2007', 'None', '2025-11-01', NULL, 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JK', 'JK', NULL, 'Avaiable as of Jan 2026'),
  (FALSE, 'Lars Wagner', '32', NULL, 'Switzerland', ARRAY['Swiss and German (EEC passport)']::text[], 'open', 'it all depends', '6 months', 'self employed and General Manager', ARRAY['3 x General Manager']::text[], '15', 'City and Resort and GOLF', 'max 600', 'yes, 2 x', 'USD 5 Mil', ARRAY['German, English and French']::text[], 'www.linkedin.com/in/lars-wagner-a306a45', NULL, '#41798787888', 'married', '6-19 April 2026', '2025-10-22', 'open to all destinations, please note that I also understand Golf very well', 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'AH', 'Direct', NULL, NULL),
  (FALSE, 'Giampaolo Ottazzi', '33', NULL, 'Italy', ARRAY['Italian']::text[], 'Italy and Europe', 'one month', '6 month', 'Interim MD Le Royal Monceau Paris', ARRAY['1) Regional Manager for Orient Express', 'for the opening of Hotel La Mninerva in Rome (17 months)', '2) Interim MD Raffles at the OWO in London (6 months0', '3) Interim MD Le Royal Monceau Paris (2,5 months)']::text[], '25', 'Resorts and main Cities', '48 to 150', '2005 and 2025', 'in all properties I have done as GM', ARRAY['ITA - UK - FR']::text[], 'https://www.linkedin.com/in/giampaolo-ottazzi-01459985', 'ottazzigiampaolo@gmail.com', ',+39 347 7444276', 'Engaged', 'August and December', 'FROM Fabruary 2026', NULL, 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JK', 'Diredct', NULL, NULL),
  (FALSE, 'Phillip Haller', '34', NULL, 'United Kingdom', ARRAY['Canadian']::text[], 'Europe, exclude Africa and China', '1 month', '6 months', 'MD PH Hospitality', ARRAY['COO of Set Hotels', 'VP of Brand - Rocco Forte']::text[], '1.7 | 8', 'ALL', '3 hotels | 16 hotels', 'Y', 'Y', ARRAY['English, Italian, French']::text[], 'www.linkedin.com/in/phillip-haller-433b3886', 'hallerphillip@gmail.com', '7769163915', 'Consulting', NULL, NULL, NULL, 'active', 'A', TRUE, TRUE, TRUE, FALSE, 'JC', '??', NULL, 'Belinda & Liz'),
  (FALSE, 'Karen Lesley Earp', '36', 'Linkedin.com/in/karen-earp', 'Great Britain', ARRAY['UK and US']::text[], 'Global No exclusions', '1 week', '8 months', 'MD Consultancy in NY, USA', ARRAY['Consultancy assignments (details available upon request) GM of the Four Seasons Santa Barbara and Coral Casino Beach and Cabana Club ( Private luxury Beach and Cabana Club) and Montecito Country Club (Golf and social luxury private Club )']::text[], '30 years', 'Resort/City', '230', 'Y', 'Y', ARRAY['English / French']::text[], 'britchic@live.com', '07518 605070', 'Single', 'n/a', NULL, NULL, NULL, 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'AH', '?', NULL, NULL),
  (FALSE, 'Jurgen Baumhoff', NULL, 'linkedin.com/in/jurgenbaumhoff', 'Australian', ARRAY['German']::text[], 'Asia/Pacific, Australasia/Europe', '4 to 6 weeks', '6 to 12 months', 'CEO & Founder | MetaPoint Advisory', ARRAY['GM InterContinental Geneva', 'RGM Switzerland IHG', 'COO Emaar Hospitality Dubai', 'CEO International Hotels', 'Bahrain']::text[], '22 years +', 'City/Resorts', '500++', 'Yes', 'Yes', ARRAY['German, English', 'Some French']::text[], 'linkedin.com/in/jurgenbaumhoff', 'jurgen@metapointadvisory.com', '61448633710', 'Married', 'Now to early | September', NULL, 'I am awaiting the approval of my Australian citizenship and if approved | I will also have an Australian passport', 'active', 'B', TRUE, TRUE, TRUE, TRUE, 'JK', 'Direct', 'N', NULL),
  (FALSE, 'Thomas Vaucouleur- De Ville D''Avray', NULL, NULL, 'Dubai - UAE (Until 08/2006)', ARRAY['France']::text[], 'None', 'None', 'Open', 'Managing Partner - Unscripted Hospitality', ARRAY['CEO - Lanvin Hotels & Residences SVP - Anthology Group GM - The PuLi Hotel']::text[], '5', 'City Resort', '<250 <100', '4', 'yes', ARRAY['French English Spanish Japanese']::text[], 'https://www.linkedin.com/in/tvdva/', 'tvdva@me.com', '00971502722501 0033675429194', 'Married', 'None', '17march2026', NULL, 'active', 'A', TRUE, TRUE, TRUE, FALSE, 'JK', 'Direct', NULL, NULL),
  (FALSE, 'Hans Heijligers', NULL, NULL, 'Netherlands', ARRAY['Dutch']::text[], 'Exclusions, RUSSIA, CIS', 'None', 'No Limit', 'Regional Director Geneva', ARRAY['Regional Director Geneva, CEO IHG Japan, VP Operations']::text[], '30+', 'All', 'Any', 'Yes', 'Yes', ARRAY['English, French, German, Dutch, all fluent']::text[], 'https://www.linkedin.com/in/hans-heijligers-0976bb4/', 'hans.heijligers@glasshousehospitality.com', '+31611865512', 'Married', 'None', '2026-02-20', NULL, 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JK', 'Direct', NULL, NULL),
  (FALSE, 'Pierre Barthes', NULL, 'PBARTHES BIO.pdf', 'France / US', ARRAY['18CC84173']::text[], 'Anywhere excluding North Africa', 'N/A', '3 months', 'MD Raffles Jeddah', ARRAY['AVP/ GM MO Hong Kong overseeing 5 hotels']::text[], '20', 'City mostly', 'from 150 t0 650', '3 as GM, 2 as HM', 'All MO properties', ARRAY['english, french']::text[], 'Dr. Pierre BARTHES, MBA, PD | LinkedIn', 'pbarthes@icloud.com', '1 (323) 504 0574', 'Married', 'Not available until Nov 26', NULL, 'Would only consider luxury properties', 'new', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (FALSE, 'Henar Rios', NULL, 'www.linkedin.com/in/henargil', 'Spain', ARRAY['Spanish Passport']::text[], 'wordlwide', '15 days / 1 month', '6 months', 'task force for Six senses', ARRAY['GM']::text[], '15', 'Resort, Residences and City', '42 smaller 249 biggest', 'yes', '32M', ARRAY['Spanish', 'English']::text[], 'www.linkedin.com/in/henargil', 'henaryana@hotmail.com | Riossastre@outlook.com', NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (FALSE, 'Sakis Dinas', NULL, 'www.linkedin.com/in/sakis-dinas', 'United Kingdom', ARRAY['Greek/British']::text[], 'No strong preference but in and around Europe due to elderly parents', 'No notice', 'No max', 'Lucknam Park, GM Charlton House, GM The Headland Hotel, GM Langshott Manor, GM', '{}'::text[], '20 years GM', 'Resorts, country houses', '50 to 100 keys', 'No opening experience', 'Plenty capex and major works', ARRAY['Greek/English/German all fluent', 'Italian']::text[], 'Sakis Dinas on LinkedIn', 'sakisdinas@hotmail.com', '7711311773', 'Single', 'No blackout dates', NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (FALSE, 'Michiel Christiaan Lugt', NULL, 'www.linkedin.com/in/michiellugt', 'Netherlands', ARRAY['Netherlands']::text[], 'Western Eurpe, ME, SE Asia', 'None', '4-6 months', 'Cluster General Manager', ARRAY['General Manager | DOO Nova Hospitality |General Manager', 'Hotel General Manager', 'Hospitality Strategy Consultant | Market Intelligence — Research the Affluent']::text[], '7', 'Resort', '200+', 'Y', 'Y', ARRAY['English, Dutch German (Basic), French (Basic), Arabic (Beginner)']::text[], 'www.linkedin.com/in/michiellugt', 'michiel.lugt@gmail.com', '+31 6 82981212', 'Single', 'None', NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (FALSE, 'Gianluca Cugnetto', NULL, 'Https://www.linkedin.com/in/gianlucacugnetto', NULL, ARRAY['Italian']::text[], 'Europe - Asia - Caribbean - Switzerland - UK', '2 weeks', 'n/a', 'Hospitality Strategy Consultant | Market Intelligence — Research the Affluent', ARRAY['Hospitality Strategy Consultant | Market Intelligence — Research the Affluent', 'Hotel General Manager']::text[], '10', 'Luxury Resorts & Hotels / Villas', '206', '8', '1.5 million', ARRAY['Italian – Native / English – Fluent / French – Fluent / Spanish – Conversational']::text[], 'https://www.linkedin.com/in/gianlucacugnetto', 'gcugnetto5@gmail.com', '393278882386', 'Single', '1st / 7th Aug', NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (FALSE, 'Marc Lannoy', NULL, NULL, 'SPAIN', ARRAY['ES287697']::text[], 'excluding usa & middle east', 'minimum', 'depending', 'complex gm westin excelsior & | st regis rome', ARRAY['the westin palace madrid', 'sheraton area manager canary', 'islands', 'are manager the netherlands']::text[], '35', 'city | resort', '2115 | 1376', '6', 'ST REGIS ROME | PALACE MADRID', ARRAY['DUTCH', 'FRENCH', 'ENGLISH', 'SPANISH']::text[], 'linkedin.com/in/marclannoy', 'marc@marclannoy.com', '34/660561996', 'married', 'tbc', NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (FALSE, 'Timothy Soper', NULL, 'https://d.docs.live.net/cfbd8050a9e995b1/Documents/TS%20Docs/RESUME.docx', 'UK', ARRAY['157465116']::text[], 'Preferred: Japan, APAC | Exclusions: None', 'Subject to calendar | available at short | notice', '3/6 mths', 'Vice President Japan, Korea | Micronesia', ARRAY['Vice President Greater', 'China, Mongolia']::text[], '10', 'City, Resorts', 'Big Box', 'Y', 'Y', ARRAY['English']::text[], 'Yes', 'timothy.soper@gmail.com+44 (0)7818 297212', NULL, 'Married', 'None', NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (FALSE, 'Christian Butler', NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 'B', TRUE, TRUE, TRUE, TRUE, 'JC', '??', NULL, NULL),
  (FALSE, 'Mark French', NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 'B', TRUE, TRUE, TRUE, TRUE, 'JK', 'Belinda', NULL, NULL),
  (FALSE, 'Andre Kretschman', NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JC', 'MNP', 'Y', NULL),
  (FALSE, 'Jeff Rednour', NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'AH', 'Direct', NULL, NULL),
  (FALSE, 'Francois Waller', NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 'B', TRUE, TRUE, TRUE, TRUE, 'JK/JC', 'Direct', NULL, NULL),
  (FALSE, 'Randall Wilkie', NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'JK/JC', 'Direct', NULL, NULL),
  (FALSE, 'Mark Wouters', NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, NULL, '{}'::text[], NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 'A', TRUE, TRUE, TRUE, TRUE, 'jc', 'MNP', NULL, NULL);
