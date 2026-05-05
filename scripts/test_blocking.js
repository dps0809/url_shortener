async function test() {
  const url = 'http://localhost:3000/api/public/shorten';
  const data = { long_url: 'http://badsite.com' };
  
  console.log('Testing badsite.com...');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  const text = await res.text();
  console.log('Status:', res.status);
  try {
    const json = JSON.parse(text);
    console.log('Response:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.log('Raw Response (HTML?):', text.slice(0, 200));
  }

  console.log('\nTesting google.com...');
  const res2 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ long_url: 'https://www.google.com' })
  });
  
  const json2 = await res2.json();
  console.log('Status:', res2.status);
  console.log('Response:', JSON.stringify(json2, null, 2));
}

test();
