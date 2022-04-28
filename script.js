'use strict'

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form')
const containerWorkouts = document.querySelector('.workouts')
const inputType = document.querySelector('.form__input--type')
const inputDistance = document.querySelector('.form__input--distance')
const inputDuration = document.querySelector('.form__input--duration')
const inputCadence = document.querySelector('.form__input--cadence')
const inputElevation = document.querySelector('.form__input--elevation')

class Workout {
  date = new Date()
  id = (Date.now() + '').slice(-10)

  constructor (coords, distance, duration) {
    this.coords = coords // [lat, lng]
    this.distance = distance //in km
    this.duration = duration // in min
  }
}

class Running extends Workout {
  type = 'running'
  constructor (coords, distance, duration, cadence) {
    super(coords, distance, duration)
    this.cadence = cadence
    this.calcPace()
  }

  calcPace () {
    // min/km
    this.pace = this.duration / this.distance
    return this.pace
  }
}

class Cycling extends Workout {
  type = 'cycling'

  constructor (coords, distance, duration, elevationGain) {
    super(coords, distance, duration)
    this.elevationGain = elevationGain
    this.calcSpeed()
  }

  calcSpeed () {
    // km/hr
    this.speed = this.distance / (this.duration / 60)
    return this.speed
  }
}

const run1 = new Running([39, -12], 5.2, 34, 178)
const cyc1 = new Cycling([39, -12], 27, 95, 532)
console.log(run1, cyc1)

////////////////////////////////////////
// APPLICATION ARCHITECTURE
class App {
  #map
  #mapEvent
  #workouts = []

  constructor () {
    this._getPosition()
    form.addEventListener('submit', this._newWorkout.bind(this))

    inputType.addEventListener('change', this._toggleElevationField)
  }

  _getPosition () {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('could not get current location')
        }
      )
  }

  _loadMap (position) {
    const { latitude } = position.coords
    const { longitude } = position.coords
    console.log(`https://www.google.pt/maps/@${latitude},${longitude}`)
    console.log(position)

    const coords = [latitude, longitude]

    this.#map = L.map('map').setView(coords, 14)

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map)

    //Handling clicks on map
    this.#map.on('click', this._showForm.bind(this))
  }

  _showForm (mapE) {
    this.#mapEvent = mapE
    form.classList.remove('hidden')
    inputDistance.focus()
  }

  _toggleElevationField () {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
  }

  _newWorkout (e) {
    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp))

    const allPositive = (...inputs) => inputs.every(inp => inp > 0)

    e.preventDefault()

    //Get data from from
    const type = inputType.value
    const distance = +inputDistance.value
    const duration = +inputDuration.value
    const { lat, lng } = this.#mapEvent.latlng
    let workout

    //If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value
      //Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers')

      workout = new Running([lat, lng], distance, duration, cadence)
    }

    //If workout cycling, create running object
    if (type === 'cycling') {
      const elevation = +inputElevation.value

      //Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers')

      workout = new Cycling([lat, lng], distance, duration, elevation)
    }

    //Render workout on map as marker
    this.renderWorkoutMarker(workout)

    // Add new object to workout array
    this.#workouts.push(workout)

    //Render workout on list

    //Hide form and clear input flieds

    //clear input fields
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value =
      ''
  }

  renderWorkoutMarker (workout) {
    //Render workout on map as marker
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`
        })
      )
      .setPopupContent('workout')
      .openPopup()
  }
}

const app = new App()
