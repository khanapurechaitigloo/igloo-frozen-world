import { World } from './World.js'
import { BEERS } from './beerData.js'

// ── Bootstrap ──
const container = document.getElementById('root')
const world = new World(container)

// ── Splash → Enter ──
const splash = document.getElementById('splash')
const hud = document.getElementById('hud')
const enterBtn = document.getElementById('enter-btn')

enterBtn.addEventListener('click', () => {
  splash.classList.add('hidden')
  hud.classList.remove('hidden')
  world.startAudio()
  setTimeout(() => splash.remove(), 700)
})

// ── Beer Panel ──
const panel = document.getElementById('beer-panel')
const panelName = document.getElementById('panel-name')
const panelStyle = document.getElementById('panel-style')
const panelDesc = document.getElementById('panel-desc')
const panelTags = document.getElementById('panel-tags')
const panelAccent = document.getElementById('panel-accent')
const panelMood = document.getElementById('panel-mood')
const closeBtn = document.getElementById('close-panel')
const backBtn = document.getElementById('back-btn')

function showBeerPanel(beer) {
  panelName.textContent = beer.name
  panelStyle.textContent = beer.style
  panelDesc.textContent = beer.description
  panelMood.textContent = beer.mood
  panelTags.innerHTML = beer.tags.map(t => `<span class="tag">${t}</span>`).join('')
  panelAccent.style.background = `linear-gradient(90deg, ${beer.glow}, transparent)`
  panel.classList.add('visible')
}

function hideBeerPanel() {
  panel.classList.remove('visible')
  world.deselect()
  world.flyBack()
}

closeBtn.addEventListener('click', hideBeerPanel)
backBtn.addEventListener('click', () => {
  hideBeerPanel()
})

// ── Click handling ──
world.onSelect((beerId) => {
  if (!beerId) { hideBeerPanel(); return }
  const beer = BEERS.find(b => b.id === beerId)
  if (beer) showBeerPanel(beer)
})

world.onFlyTo(() => {
  backBtn.classList.remove('hidden')
})

world.onFlyBack(() => {
  backBtn.classList.add('hidden')
})
