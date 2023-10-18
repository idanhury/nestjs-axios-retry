const arrayEn = [];
const arrayHe = [];
const arrayFr = [];

async function fetchData(index, route) {
  const startTime = performance.now();

  try {
    const response = await fetch(`http://localhost:3000/${route}`);
    const endTime = performance.now();
    const elapsedTime = +((endTime - startTime) / 1000).toFixed(2);

    if (route === 'en') {
      arrayEn.push(`${route} - Request ${index}. took ${elapsedTime} seconds.`);
    } else if (route === 'he') {
      arrayHe.push(`${route} - Request ${index}. took ${elapsedTime} seconds.`);
    } else {
      arrayFr.push(`${route} - Request ${index}. took ${elapsedTime} seconds.`);
    }

    // console.log(`${index} Request took ${elapsedTime} seconds.`);
  } catch (error) {
    console.error(`Error in request ${index}: ${error}`);
  }
}

async function measureTimeForEachPromise() {
  const promises = [];
  const startTime = performance.now();
  for (let i = 0; i < 20; i++) {
    promises.push(fetchData(i, 'en'));
    promises.push(fetchData(i, 'he'));
    promises.push(fetchData(i, 'fr'));
  }

  await Promise.all(promises);
  // console.table(arrayEn);
  //   console.table(arrayHe);
  //   console.table(arrayFr);
  const endTime = performance.now();
  const elapsedTime = +((endTime - startTime) / 1000).toFixed(2);
  console.log('00TOTAL TIME', elapsedTime)
}

measureTimeForEachPromise();
