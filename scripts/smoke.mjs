const services = [
  ['CRM backend', 'http://localhost:4000/api/health'],
  ['Simulator', 'http://localhost:4100/health']
];

async function check(label, url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${label} failed with ${response.status}`);
  }
  return response.json();
}

async function main() {
  const results = [];
  for (const [label, url] of services) {
    results.push([label, await check(label, url)]);
  }

  const bootstrap = await check('Bootstrap', 'http://localhost:4000/api/bootstrap');
  console.log(`Bootstrap customers: ${bootstrap.customers.length}`);
  console.log(`Bootstrap campaigns: ${bootstrap.campaigns.length}`);
  for (const [label, payload] of results) {
    console.log(`${label}: ${JSON.stringify(payload)}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
