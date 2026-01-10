const GROWTH_STAGES = [
  { delay: 2 * 60 * 1000, action: seedMoss },
  { delay: 3 * 60 * 1000, action: expandMoss },
  { delay: 10 * 60 * 1000, action: addFerns },
  { delay: 20 * 60 * 1000, action: startDecay },
  { delay: 24 * 60 * 1000, action: shedGrowth },
  { delay: 26 * 60 * 1000, action: buildDirt },
  { delay: 30 * 60 * 1000, action: sproutPlants },
  { delay: 38 * 60 * 1000, action: growTrees },
  { delay: 45 * 60 * 1000, action: startWeather },
  { delay: 48 * 60 * 1000, action: lightningStrike }
];

const growthState = {
  containers: [],
  mossTufts: [],
  ferns: [],
  ground: null,
  tree: null,
  sky: null,
  lightning: null
};

function scheduleGrowth() {
  GROWTH_STAGES.forEach(({ delay, action }) => {
    window.setTimeout(action, delay);
  });
}

function getContainers() {
  return Array.from(document.querySelectorAll('main section, .resolution, .post'));
}

function ensureGrowthLayer(container) {
  let layer = container.querySelector('.growth-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'growth-layer';
    container.appendChild(layer);
  }
  return layer;
}

function createMossTuft(layer, options = {}) {
  const tuft = document.createElement('span');
  tuft.className = 'moss-tuft';
  const side = options.side ?? (Math.random() > 0.5 ? 'left' : 'right');
  const top = options.top ?? Math.floor(Math.random() * 80 + 8);
  const offset = options.offset ?? Math.floor(Math.random() * 6 + 2);
  tuft.style.top = `${top}%`;
  if (side === 'left') {
    tuft.style.left = `${offset}px`;
  } else {
    tuft.style.right = `${offset}px`;
  }
  layer.appendChild(tuft);
  requestAnimationFrame(() => {
    tuft.classList.add('is-growing');
  });
  growthState.mossTufts.push(tuft);
}

function seedMoss() {
  growthState.containers = getContainers();
  growthState.containers.forEach((container) => {
    const layer = ensureGrowthLayer(container);
    createMossTuft(layer, { side: 'left', top: 18 });
    createMossTuft(layer, { side: 'right', top: 28 });
  });
}

function expandMoss() {
  growthState.mossTufts.forEach((tuft) => tuft.classList.add('is-expanded'));
  growthState.containers.forEach((container) => {
    const layer = ensureGrowthLayer(container);
    createMossTuft(layer);
  });
}

function addFerns() {
  growthState.containers.forEach((container) => {
    const layer = ensureGrowthLayer(container);
    const fern = document.createElement('span');
    fern.className = 'growth-fern';
    fern.style.bottom = `${Math.floor(Math.random() * 16 + 6)}px`;
    fern.style.left = `${Math.floor(Math.random() * 15 + 6)}px`;
    if (Math.random() > 0.5) {
      fern.style.left = 'auto';
      fern.style.right = `${Math.floor(Math.random() * 15 + 6)}px`;
    }
    layer.appendChild(fern);
    requestAnimationFrame(() => {
      fern.classList.add('is-visible');
    });
    growthState.ferns.push(fern);
  });
}

function startDecay() {
  document.body.classList.add('growth-decay');
}

function shedGrowth() {
  document.body.classList.add('growth-shed');
}

function buildDirt() {
  if (growthState.ground) {
    growthState.ground.classList.add('is-rich');
    return;
  }
  const ground = document.createElement('div');
  ground.className = 'growth-ground';
  const dirt = document.createElement('div');
  dirt.className = 'dirt-layer';
  ground.appendChild(dirt);
  document.body.appendChild(ground);
  growthState.ground = ground;
  requestAnimationFrame(() => {
    ground.classList.add('is-rich');
  });
}

function sproutPlants() {
  if (!growthState.ground) {
    buildDirt();
  }
  const positions = [20, 45, 70];
  positions.forEach((left) => {
    const sprout = document.createElement('span');
    sprout.className = 'sprout';
    sprout.style.left = `${left}%`;
    growthState.ground.appendChild(sprout);
    requestAnimationFrame(() => {
      sprout.classList.add('is-growing');
    });
  });

  const bush = document.createElement('span');
  bush.className = 'bush';
  bush.style.left = '60%';
  growthState.ground.appendChild(bush);
  requestAnimationFrame(() => bush.classList.add('is-grown'));
}

function growTrees() {
  if (!growthState.ground) {
    buildDirt();
  }
  const tree = document.createElement('span');
  tree.className = 'tree';
  tree.style.left = '80%';
  growthState.ground.appendChild(tree);
  requestAnimationFrame(() => tree.classList.add('is-grown'));
  growthState.tree = tree;
}

function startWeather() {
  if (growthState.sky) {
    growthState.sky.classList.add('is-stormy', 'is-raining');
    return;
  }
  const sky = document.createElement('div');
  sky.className = 'growth-sky';
  const cloud = document.createElement('div');
  cloud.className = 'growth-cloud';
  cloud.style.top = '20px';
  const cloud2 = document.createElement('div');
  cloud2.className = 'growth-cloud';
  cloud2.style.top = '80px';
  cloud2.style.animationDelay = '10s';
  const rain = document.createElement('div');
  rain.className = 'growth-rain';
  const lightning = document.createElement('div');
  lightning.className = 'growth-lightning';
  sky.appendChild(cloud);
  sky.appendChild(cloud2);
  sky.appendChild(rain);
  sky.appendChild(lightning);
  document.body.appendChild(sky);
  growthState.sky = sky;
  growthState.lightning = lightning;
  requestAnimationFrame(() => {
    sky.classList.add('is-stormy', 'is-raining');
  });
}

function lightningStrike() {
  if (!growthState.sky) {
    startWeather();
  }
  if (growthState.lightning) {
    growthState.lightning.classList.add('is-flashing');
  }
  if (growthState.tree) {
    growthState.tree.classList.add('is-dead');
    window.setTimeout(() => {
      growthState.tree.classList.add('is-stump');
    }, 2 * 60 * 1000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  scheduleGrowth();
});
