import WorkshopHeaderComponent from '../workshop-header/workshop-header.vue'
export default {
   name: 'WorkshopsComponent',
   components: {
      WorkshopHeaderComponent
   },
   data: () => ({
      height: 0,
      loaded: false,
      timeout: null,
      workshops: [],
      title: 'قائمة ورش العمل',
      drawer: {
         isOpen: true,
         isRight: false
      },
      current: {
         workshop: {}
      }
   }),
   created() {
      this.$on('toggle-drawer', function(data) {
         this.drawer.isOpen = !this.drawer.isOpen
      })
      this.$on('clearTimeout', function(data) {
         clearTimeout(this.timeout)
      })
      this.drawer.isRight = this.$store.state.direction === 'rtl'
      this.$store.commit('getGithubFileURL', {
         repo: `${this.$route.params.track}-tutorials`,
         path: 'workshops.json'
      })
      this.$http.get(this.$store.state.githubFileURL)
         .then(data => {
            this.workshops = this.parseData(data)
            if (typeof this.$route.params.workshop === 'undefined') {
               this.$router.push({
                  name: 'workshop',
                  params: {
                     workshop: this.workshops[0].url.params.workshop
                  }
               })
            } else {
               let workshop = this.workshops[this.getWorkshopId()]
               this.current.workshop = workshop
            }
            this.loaded = true
         }).catch(err => {
            console.error(err)
         })
   },
   updated() {
      document.querySelectorAll('#sidenav .stepper__step__step').forEach((stepper, index) => {
         stepper.setAttribute('data-index', index + 1)
         if (this.workshops[index].progress !== 0 && this.workshops[index].progress !== 100) {
            stepper.style.background = this.progress(this.workshops[index].progress);
         }
      })
   },
   watch: {
      $route(to, from) {
         let workshop = this.workshops[this.getWorkshopId()]
         this.current.workshop = workshop
      }
   },
   methods: {
      onResize() {
         let selector = '.workshops >.workshop-header >.toolbar'
         if (document.querySelector(selector) !== null) {
            this.height = window.innerHeight - document.querySelector(selector).offsetHeight
         } else {
            let self = this
            this.timeout = setTimeout(() => {
               self.height = window.innerHeight - document.querySelector(selector).offsetHeight
            }, 100)
         }
      },
      progress(percent) {
         let maxPercent = 100
         let increment = 360 / maxPercent
         let half = Math.round(maxPercent / 2)
         let gradient = ''
         if (percent < half) {
            let nextdeg = 90 + (increment * percent)
            gradient = `linear-gradient(90deg, var(--workshop-normal-state) 50%, transparent 50%, transparent),linear-gradient(${nextdeg}deg, var(--workshop-complete-state) 50%, var(--workshop-normal-state) 50%, var(--workshop-normal-state))`

         } else {
            let nextdeg = -90 + (increment * (percent - half));
            gradient = `linear-gradient(${nextdeg}deg, var(--workshop-complete-state) 50%, transparent 50%, transparent),linear-gradient(270deg, var(--workshop-complete-state) 50%, var(--workshop-normal-state) 50%, var(--workshop-normal-state))`
         }
         return gradient
      },
      getWorkshopId() {
         let index = this.workshops.findIndex(function(workshop) {
            return this.$route.params.workshop === workshop.url.params.workshop
         }.bind(this))
         if (index === -1) {
            this.$router.push('/404')
         } else {
            return index
         }
      },
      // This is a temporary function
      parseData(data) {
         let workshops = []
         data.forEach((workshop, workshopIndex) => {
            workshops.push({
               index: workshopIndex + 1,
               url: {
                  name: 'workshop',
                  params: {
                     workshop: workshop.slug,
                  }
               },
               level: workshop.level,
               title: workshop.title,
               duration: workshop.duration,
               description: workshop.description,
               shown_percentage: workshop.shown_percentage,
               used_technologies: workshop.used_technologies.split(', ').reverse(),
               last_update_date: this.$date.get(new Date(workshop.last_update_date)),
               authors: workshop.authors,
               modules: []
            })
            workshop.modules.forEach((module, moduleIndex) => {
               workshops[workshopIndex].modules.push({
                  title: module.title,
                  index: moduleIndex + 1,
                  url: {
                     name: 'modules',
                     params: {
                        modules: module.slug,
                     }
                  },
                  lessons: []
               })
               module.lessons.forEach((lesson) => {
                  workshops[workshopIndex].modules[moduleIndex].lessons.push({
                     url: {
                        name: 'modules',
                        params: {
                           module: module.slug,
                           lesson: lesson.slug,
                        },
                        query: {
                           url: this.$encryption.b64EncodeUnicode(lesson.url),
                           type: this.$encryption.b64EncodeUnicode(lesson.type),
                           notes: this.$encryption.b64EncodeUnicode(lesson.notes_url)
                        }
                     },
                     query: {
                        url: this.$encryption.b64EncodeUnicode(lesson.url),
                        type: this.$encryption.b64EncodeUnicode(lesson.type),
                        notes: this.$encryption.b64EncodeUnicode(lesson.notes_url)
                     },
                     type: lesson.type,
                     title: lesson.title,
                     is_shown: lesson.is_shown
                  })
               })
            })
         })
         return workshops
      }
   }
}
