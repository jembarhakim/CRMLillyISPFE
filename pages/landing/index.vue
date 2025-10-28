<template>
  <div class="landing-page">
    <!-- Header/Navbar -->
    <header 
      class="nav-header py-3 px-4"
      :class="{ 'scrolled': isScrolled }"
      :style="{ borderBottomColor: themeColor }"
    >
      <nav class="container mx-auto flex items-center justify-between max-w-full">
        <span class="my-font text-2xl sm:text-3xl md:text-4xl">
          Lilly <span :style="{ color: themeColor }">ISP</span>
        </span>
        
        <div class="hidden lg:flex items-center gap-2 flex-wrap">
          <button
            v-for="(tab, index) in tabs"
            :key="index"
            @click="navigateToSection(tab.id, index)"
            :style="selectedTab === index ? { backgroundColor: themeColor, color: 'white' } : { backgroundColor: 'transparent', color: '#d1d5db' }"
            class="custom_tab px-4 lg:px-6 py-2 text-xs lg:text-sm rounded hover:opacity-90 transition-all"
          >
            {{ tab.label }}
          </button>
          
          <!-- Login Button -->
          <NuxtLink
            to="/login"
            :style="{ backgroundColor: themeColor }"
            class="px-4 lg:px-6 py-2 text-white text-xs lg:text-sm rounded font-semibold hover:opacity-90 transition-all ml-2"
          >
            Login
          </NuxtLink>
          
          <!-- Color Picker -->
          <div class="relative ml-2">
            <button
              @click="showColorPicker = !showColorPicker"
              :style="{ backgroundColor: themeColor }"
              class="color-picker-btn p-2 text-white rounded"
              title="Theme color"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
                <circle cx="10" cy="10" r="3"/>
              </svg>
            </button>
            <div v-if="showColorPicker" class="absolute right-0 mt-2 p-4 bg-white rounded shadow-lg z-50">
              <input 
                v-model="themeColor" 
                type="color" 
                class="w-32 h-32 cursor-pointer border-0"
              />
            </div>
          </div>
        </div>
        
        <!-- Mobile Menu Button -->
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="lg:hidden text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </nav>
      
      <!-- Mobile Menu -->
      <div v-if="mobileMenuOpen" class="lg:hidden bg-gray-800 px-4 py-4 max-w-full">
        <button
          v-for="(tab, index) in tabs"
          :key="index"
          @click="navigateToSection(tab.id, index); mobileMenuOpen = false"
          :style="selectedTab === index ? { backgroundColor: themeColor, color: 'white' } : {}"
          class="block w-full text-left px-4 py-3 text-white hover:bg-gray-700 rounded mb-2 text-sm"
        >
          {{ tab.label }}
        </button>
        <NuxtLink
          to="/login"
          :style="{ backgroundColor: themeColor }"
          class="block w-full text-center px-4 py-3 text-white rounded font-semibold mt-2"
        >
          Login
        </NuxtLink>
      </div>
    </header>

    <!-- Hero Carousel -->
    <section class="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[639px] overflow-hidden w-full">
      <div
        v-for="(slide, index) in slides"
        :key="index"
        v-show="currentSlide === index"
        class="absolute inset-0 transition-opacity duration-1000 w-full h-full"
        :style="{ backgroundImage: `url(${slide.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }"
      >
        <div class="absolute inset-0 flex items-center justify-center w-full" style="background-color: rgba(0, 0, 0, 0.68)">
          <div class="custom-caption px-4 sm:px-6 md:px-8 w-full max-w-full">
            <h1 class="main_line animation_2 px-4" v-html="slide.title"></h1>
            <div class="h-6 sm:h-8 md:h-10"></div>
            <h4 class="subtitle-text animation_1 max-w-4xl mx-auto px-4" v-html="slide.subtitle"></h4>
            <div class="h-6 sm:h-8 md:h-10"></div>
            <div class="animation_2">
              <button 
                :style="{ backgroundColor: themeColor }" 
                class="px-4 sm:px-6 md:px-8 py-2 sm:py-3 text-white text-sm sm:text-base md:text-lg rounded hover:opacity-90 transition-all"
              >
                READ MORE
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Carousel Controls -->
      <button
        @click="prevSlide"
        class="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 text-white p-2 sm:p-3 rounded-full transition-all z-10"
      >
        <svg class="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <button
        @click="nextSlide"
        class="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 text-white p-2 sm:p-3 rounded-full transition-all z-10"
      >
        <svg class="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      
      <!-- Carousel Indicators -->
      <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        <button
          v-for="(slide, index) in slides"
          :key="index"
          @click="currentSlide = index"
          class="w-3 h-3 rounded-full transition-all"
          :class="currentSlide === index ? 'bg-white' : 'bg-white bg-opacity-50'"
        ></button>
      </div>
    </section>

    <!-- Services Section -->
    <section class="py-10 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 w-full max-w-full">
      <div class="container mx-auto max-w-full">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          <div
            v-for="(service, index) in services"
            :key="index"
            class="box-shadow bg-white p-4 sm:p-6 rounded-lg text-center w-full"
          >
            <div :style="{ color: themeColor }" class="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">
              <i :class="service.icon"></i>
            </div>
            <h3 class="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3">{{ service.title }}</h3>
            <p class="text-sm sm:text-base text-gray-600">
              Fast and reliable internet connection for your home and office needs. Enjoy seamless browsing experience.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Company Description Section -->
    <section class="quote w-full">
      <div class="flex items-center justify-center min-h-[300px] sm:min-h-[350px] md:min-h-[400px] px-4 sm:px-6 md:px-8" style="background-color: rgba(0, 0, 0, 0.68)">
        <div class="text-center text-white max-w-4xl w-full">
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Tentang <span :style="{ color: themeColor }">LILLY</span></h2>
          <p class="text-base sm:text-lg md:text-xl leading-relaxed mb-6 sm:mb-8 px-4 text-gray-200">
            LILLY perusahaan yang bergerak pada bidang Project Management, Konsultan IT dan Internet Service Provider. 
            Bidang usaha kami mengikuti perkembangan dunia teknologi informasi dengan memberikan solusi, perencanaan, 
            dan strategi yang terintegrasi sebagai nilai tambah bagi kebutuhan berbagai layanan dibidang Teknologi Informasi.
          </p>
          <a
            href="#id_services"
            :style="{ backgroundColor: themeColor }"
            class="inline-block px-6 sm:px-8 md:px-10 py-3 sm:py-4 text-white text-sm sm:text-base md:text-lg rounded hover:opacity-90 transition-all"
          >
            Lihat Layanan Kami
          </a>
        </div>
      </div>
    </section>

    <!-- Portfolio Section -->
    <section id="id_portfolio" class="py-10 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-gray-50 w-full max-w-full">
      <div class="container mx-auto max-w-full">
        <div class="text-center mb-8 sm:mb-12 md:mb-16 px-4">
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-gray-900">Our Services</h2>
          <p class="text-base sm:text-lg md:text-xl text-gray-600">Comprehensive internet solutions tailored to your needs.</p>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
          <div
            v-for="(portfolio, index) in portfolioItems"
            :key="index"
            class="flashcard-container"
          >
            <div class="flashcard">
              <div class="flashcard-front relative group">
                <img 
                  :src="portfolio.image" 
                  :alt="portfolio.title"
                  class="w-full h-full object-cover"
                  @error="handleImageError"
                />
                <!-- Dark overlay with text -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                  <div class="absolute bottom-0 left-0 right-0 p-6">
                    <h3 class="text-white text-lg font-bold uppercase tracking-wide">{{ portfolio.title }}</h3>
                    <p class="text-gray-200 text-sm mt-2">{{ portfolio.subtitle }}</p>
                  </div>
                </div>
              </div>
              <div 
                class="flashcard-back relative overflow-hidden"
                :style="{ background: `linear-gradient(135deg, ${themeColor} 0%, #991b1b 100%)` }"
              >
                <!-- Decorative circles -->
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                
                <!-- Content -->
                <div class="relative z-10 flex flex-col items-center justify-center h-full p-4">
                  <!-- Icon -->
                  <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
                    <i class="fas fa-wifi text-2xl text-white"></i>
                  </div>
                  
                  <!-- Title -->
                  <h3 class="text-white text-sm font-bold text-center mb-2 leading-tight uppercase tracking-wide px-2" style="font-size: 13px; line-height: 1.3;">
                    {{ portfolio.title }}
                  </h3>
                  
                  <!-- Divider -->
                  <div class="w-12 h-0.5 bg-white/50 rounded-full mb-3"></div>
                  
                  <!-- Description -->
                  <p class="text-white/90 text-xs text-center leading-relaxed px-3" style="font-size: 12px; line-height: 1.5;">
                    {{ portfolio.description }}
                  </p>
                  
                  <!-- Learn More Button -->
                  <button class="mt-3 px-5 py-1.5 bg-white text-gray-900 rounded-full font-semibold text-xs hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg">
                    Learn More →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About Us Section -->
    <section id="id_about_us" class="py-10 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 w-full max-w-full">
      <div class="container mx-auto max-w-full">
        <div class="text-center mb-8 sm:mb-12 md:mb-16 px-4">
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Why Choose Lilly ISP</h2>
          <p class="text-base sm:text-lg md:text-xl text-gray-600">We are committed to providing the best internet service experience.</p>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div
            v-for="(item, index) in aboutItems"
            :key="index"
            @mouseenter="hoverAbout(index)"
            @mouseleave="unhoverAbout(index)"
            class="my-card box-shadow bg-white rounded-lg overflow-hidden w-full"
          >
            <img 
              :src="item.image" 
              :alt="item.title"
              class="w-full h-48 sm:h-56 md:h-64 object-cover"
              @error="handleImageError"
            />
            <div class="p-4 sm:p-5 md:p-6">
              <div class="text-xs sm:text-sm uppercase mb-2" :style="{ color: themeColor }">Why Choose Us</div>
              <h3 
                class="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 transition-colors duration-300"
                :style="{ color: item.hovered ? themeColor : '#424242' }"
                :class="{ 'animate-bounce': item.hovered }"
              >
                {{ item.title }}
              </h3>
              <p class="text-sm sm:text-base text-gray-600">
                {{ item.subtitle }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Vision & Mission Section -->
    <section class="py-10 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-white w-full max-w-full">
      <div class="container mx-auto max-w-full">
        <div class="text-center mb-8 sm:mb-12 md:mb-16 px-4">
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-gray-900">Visi & Misi</h2>
          <p class="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">Komitmen kami untuk memberikan layanan IT terbaik</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 max-w-5xl mx-auto">
          <!-- Visi -->
          <div class="bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 rounded-2xl shadow-lg border-l-4" :style="{ borderColor: themeColor }">
            <div class="flex items-center mb-4 sm:mb-6">
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center" :style="{ backgroundColor: themeColor }">
                <i class="fas fa-eye text-xl sm:text-2xl text-white"></i>
              </div>
              <h3 class="text-xl sm:text-2xl font-bold ml-4 text-gray-900">Visi</h3>
            </div>
            <ul class="space-y-3 sm:space-y-4">
              <li class="flex items-start text-gray-700">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" :style="{ color: themeColor }" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span class="text-sm sm:text-base">Dapat memberikan layanan dibidang IT secara komprehensif.</span>
              </li>
              <li class="flex items-start text-gray-700">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" :style="{ color: themeColor }" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span class="text-sm sm:text-base">Mampu mendukung berbagai kebutuhan teknologi IT.</span>
              </li>
            </ul>
          </div>
          
          <!-- Misi -->
          <div class="bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 rounded-2xl shadow-lg border-l-4" :style="{ borderColor: themeColor }">
            <div class="flex items-center mb-4 sm:mb-6">
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center" :style="{ backgroundColor: themeColor }">
                <i class="fas fa-bullseye text-xl sm:text-2xl text-white"></i>
              </div>
              <h3 class="text-xl sm:text-2xl font-bold ml-4 text-gray-900">Misi</h3>
            </div>
            <ul class="space-y-3 sm:space-y-4">
              <li class="flex items-start text-gray-700">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" :style="{ color: themeColor }" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span class="text-sm sm:text-base">Melakukan RnD dan implementasi berkala untuk mencapai efisiensi.</span>
              </li>
              <li class="flex items-start text-gray-700">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" :style="{ color: themeColor }" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span class="text-sm sm:text-base">Memberikan pelayanan purna jual terstruktur mengikuti perubahan.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Services Detail Section -->
    <section id="id_services" class="py-10 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-100 w-full max-w-full">
      <div class="container mx-auto max-w-full">
        <div class="text-center mb-8 sm:mb-12 md:mb-16 px-4">
          <div class="inline-block mb-3 sm:mb-4">
            <span class="text-xs sm:text-sm font-semibold uppercase tracking-wider px-3 sm:px-4 py-1.5 sm:py-2 rounded-full" :style="{ backgroundColor: themeColor + '20', color: themeColor }">
              Layanan Kami
            </span>
          </div>
          <h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-gray-900">Perlu Layanan Lain?</h2>
          <p class="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">Solusi lengkap teknologi informasi untuk berbagai kebutuhan bisnis Anda.</p>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div
            v-for="(service, index) in detailedServices"
            :key="index"
            class="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 w-full"
          >
            <div class="p-6 sm:p-8">
              <div 
                :style="{ backgroundColor: themeColor }" 
                class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300"
              >
                <i :class="service.icon" class="text-3xl sm:text-4xl text-white"></i>
              </div>
              <h3 class="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{{ service.title }}</h3>
              <p class="text-sm sm:text-base text-gray-600 leading-relaxed">{{ service.description }}</p>
              <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
                <a 
                  href="#id_contact_us" 
                  class="inline-flex items-center text-xs sm:text-sm font-semibold transition-colors duration-200"
                  :style="{ color: themeColor }"
                >
                  Pelajari Lebih Lanjut
                  <svg class="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonial Section -->
    <section id="id_testimonial" class="quote w-full">
      <div style="background-color: rgba(0, 0, 0, 0.68)" class="py-10 sm:py-16 md:py-20">
        <div class="container mx-auto px-4 sm:px-6 md:px-8 max-w-full">
          <div class="relative max-w-4xl mx-auto w-full">
            <div
              v-for="(testimonial, index) in testimonials"
              :key="index"
              v-show="currentTestimonial === index"
              class="text-center text-white transition-opacity duration-500 px-4"
            >
              <img
                :src="testimonial.image"
                :alt="testimonial.name"
                class="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-lg mx-auto mb-4 sm:mb-6 border-4"
                :style="{ borderColor: themeColor }"
                @error="handleImageError"
              />
              <div class="mb-3 sm:mb-4">
                <h3 class="text-xl sm:text-2xl font-semibold" :style="{ color: themeColor }">{{ testimonial.name }}</h3>
                <p class="text-xs sm:text-sm uppercase text-gray-300">{{ testimonial.role }}</p>
              </div>
              <p class="text-base sm:text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
                "Lilly ISP has provided excellent internet service. Fast connection, stable, and responsive customer support. Highly recommended!"
              </p>
            </div>
            
            <!-- Navigation -->
            <div class="flex justify-center gap-2 mt-6 sm:mt-8">
              <button
                v-for="(testimonial, index) in testimonials"
                :key="index"
                @click="currentTestimonial = index"
                class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all"
                :class="currentTestimonial === index ? 'bg-white' : 'bg-white bg-opacity-50'"
              ></button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section id="id_team" class="py-10 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 w-full max-w-full">
      <div class="container mx-auto max-w-full">
        <div class="text-center mb-8 sm:mb-12 md:mb-16 px-4">
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Our Team</h2>
          <p class="text-base sm:text-lg md:text-xl text-gray-600">Professional and experienced team ready to serve you.</p>
        </div>
        
        <div class="relative overflow-hidden w-full">
          <div class="flex transition-transform duration-500" :style="{ transform: `translateX(-${currentTeamSlide * 100}%)` }">
            <div
              v-for="slideIndex in 3"
              :key="slideIndex"
              class="w-full flex-shrink-0"
            >
              <div class="flex flex-wrap justify-center gap-3 sm:gap-4 px-2">
                <div
                  v-for="memberIndex in 4"
                  :key="memberIndex"
                  class="team-flashcard-container"
                >
                  <div class="team-flashcard">
                    <div class="flashcard-front">
                      <img
                        :src="`/statics/images/team_${memberIndex}.png`"
                        alt="Team Member"
                        class="w-full h-full object-cover"
                        @error="handleImageError"
                      />
                    </div>
                    <div
                      class="flashcard-back"
                      :style="{ backgroundColor: themeColor + 'b3' }"
                    >
                      <h3 class="text-base sm:text-lg md:text-xl font-bold uppercase mb-2">TECHNICAL SUPPORT</h3>
                      <p class="text-xs sm:text-sm italic mb-4 sm:mb-8">Network Specialist</p>
                      <div class="flex gap-3 sm:gap-4">
                        <button class="bg-white rounded-full p-2 sm:p-3 hover:scale-110 transition-transform">
                          <svg :style="{ color: themeColor }" class="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a8 8 0 100 16 8 8 0 000-16z"/>
                          </svg>
                        </button>
                        <button class="bg-white rounded-full p-2 sm:p-3 hover:scale-110 transition-transform">
                          <svg :style="{ color: themeColor }" class="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3-2.828-2.828 3-3z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Team Navigation -->
          <div class="flex justify-center gap-2 mt-6 sm:mt-8">
            <button
              v-for="index in 3"
              :key="index"
              @click="currentTeamSlide = index - 1"
              class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all"
              :class="currentTeamSlide === index - 1 ? 'bg-blue-600' : 'bg-gray-300'"
            ></button>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="id_pricing" class="pricing relative w-full">
      <!-- Dark overlay for better text visibility -->
      <div class="absolute inset-0 bg-black/75"></div>
      
      <div class="relative z-10 py-10 sm:py-16 md:py-20">
        <div class="container mx-auto px-4 sm:px-6 md:px-8 max-w-full">
          <div class="text-center mb-8 sm:mb-12 md:mb-16 px-4">
            <div class="inline-block mb-3 sm:mb-4">
              <span class="text-xs sm:text-sm font-semibold uppercase tracking-wider px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 text-white backdrop-blur-sm">
                Choose Your Plan
              </span>
            </div>
            <h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white">Internet Packages</h2>
            <p class="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">Choose the package that suits your needs and budget. All plans include 24/7 support.</p>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto">
            <div
              v-for="(plan, index) in pricingPlans"
              :key="index"
              class="group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 w-full"
              :class="{ 'ring-2 sm:ring-4 ring-white ring-opacity-50 scale-100 sm:scale-105': plan.popular }"
            >
              <!-- Popular Badge -->
              <div v-if="plan.popular" class="absolute top-0 right-0 z-10">
                <div class="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-4 py-1 sm:py-2 rounded-bl-xl sm:rounded-bl-2xl shadow-lg">
                  ⭐ POPULAR
                </div>
              </div>
              
              <!-- Header -->
              <div
                :style="{ backgroundColor: plan.color }"
                class="text-white text-center py-6 sm:py-8 relative overflow-hidden"
              >
                <div class="absolute inset-0 opacity-20">
                  <div class="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                </div>
                <h3 class="text-2xl sm:text-3xl font-bold uppercase tracking-wide relative z-10">{{ plan.name }}</h3>
                <p class="text-white/90 mt-2 text-xs sm:text-sm relative z-10 px-2">{{ plan.description }}</p>
              </div>
              
              <!-- Body -->
              <div class="p-4 sm:p-6 md:p-8">
                <!-- Features List -->
                <ul class="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <li class="flex items-start text-gray-700">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" :style="{ color: plan.color }" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-xs sm:text-sm md:text-base font-medium">Up to <strong>{{ plan.speed }} Mbps</strong></span>
                  </li>
                  <li class="flex items-start text-gray-700">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" :style="{ color: plan.color }" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-xs sm:text-sm md:text-base">{{ plan.devices }} Connected Devices</span>
                  </li>
                  <li class="flex items-start text-gray-700">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" :style="{ color: plan.color }" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-xs sm:text-sm md:text-base">{{ plan.support }}</span>
                  </li>
                  <li class="flex items-start text-gray-700">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" :style="{ color: plan.color }" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-xs sm:text-sm md:text-base">{{ plan.ipType }}</span>
                  </li>
                  <li v-if="plan.bonus" class="flex items-start text-gray-700">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" :style="{ color: plan.color }" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-xs sm:text-sm md:text-base font-semibold text-green-600">{{ plan.bonus }}</span>
                  </li>
                </ul>
                
                <!-- Divider -->
                <div class="border-t border-gray-200 my-4 sm:my-6"></div>
                
                <!-- Price -->
                <div class="text-center mb-4 sm:mb-6">
                  <div class="flex items-center justify-center gap-1">
                    <span class="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Rp</span>
                    <span class="text-3xl sm:text-4xl md:text-5xl font-black" :style="{ color: plan.color }">
                      {{ plan.price.toLocaleString('id-ID') }}
                    </span>
                  </div>
                  <p class="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-2">/month</p>
                </div>
                
                <!-- CTA Button -->
                <button
                  :style="{ backgroundColor: plan.color }"
                  class="w-full py-3 sm:py-4 text-white text-sm sm:text-base font-bold rounded-lg sm:rounded-xl hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Choose Plan
                </button>
                
                <!-- Terms -->
                <p class="text-center text-[10px] sm:text-xs text-gray-500 mt-3 sm:mt-4">Terms and Conditions apply</p>
              </div>
            </div>
          </div>
          
          <!-- Bottom CTA -->
          <div class="text-center mt-10 sm:mt-12 md:mt-16 px-4">
            <p class="text-white text-base sm:text-lg mb-3 sm:mb-4">Need a custom package? Contact us for special offers!</p>
            <a
              href="#id_contact_us"
              class="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-900 text-sm sm:text-base font-bold rounded-lg sm:rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Contact Sales Team
              <svg class="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Latest News Section -->
    <section id="id_news" class="py-10 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 w-full max-w-full">
      <div class="container mx-auto max-w-full">
        <div class="text-center mb-8 sm:mb-12 md:mb-16 px-4">
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Latest Updates</h2>
          <p class="text-base sm:text-lg md:text-xl text-gray-600">Stay informed with our latest news and promotions.</p>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div
            v-for="(item, index) in newsItems"
            :key="index"
            @mouseenter="hoverNews(index)"
            @mouseleave="unhoverNews(index)"
            class="my-card box-shadow bg-white rounded-lg overflow-hidden w-full"
          >
            <img
              :src="item.image"
              :alt="item.title"
              class="w-full h-48 sm:h-56 md:h-64 object-cover"
              @error="handleImageError"
            />
            <div class="p-4 sm:p-5 md:p-6">
              <h3
                class="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 transition-colors duration-300"
                :style="{ color: item.hovered ? themeColor : '#424242' }"
                :class="{ 'animate-bounce': item.hovered }"
              >
                {{ item.title }}
              </h3>
              <p class="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Find out about our latest network expansion, special offers, and service improvements for our valued customers.
              </p>
              <button
                :style="{ backgroundColor: themeColor }"
                class="px-4 sm:px-6 py-2 text-white text-xs sm:text-sm rounded hover:opacity-90 transition-all"
              >
                READ MORE
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Us Section -->
    <section id="id_contact_us" class="contact_us relative w-full">
      <div class="absolute inset-0 bg-black/75"></div>
      
      <div class="relative z-10 py-10 sm:py-16 md:py-20">
        <div class="container mx-auto px-4 sm:px-6 md:px-8 max-w-full">
          <div class="text-center mb-8 sm:mb-10 md:mb-12 px-4">
            <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-white">Get in Touch</h2>
            <p class="text-base sm:text-lg text-gray-300">Have questions? We're here to help you 24/7.</p>
          </div>
          
          <div class="max-w-5xl mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              <!-- Left Column - Contact Inputs -->
              <div class="space-y-4 sm:space-y-5">
                <div class="relative">
                  <input
                    v-model="contactForm.name"
                    type="text"
                    placeholder="Your Name *"
                    class="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 bg-white border-0 rounded-lg outline-none text-gray-700 placeholder-gray-400 text-sm sm:text-base"
                  />
                  <i class="fas fa-user absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-sm sm:text-base" :style="{ color: themeColor }"></i>
                </div>
                
                <div class="relative">
                  <input
                    v-model="contactForm.email"
                    type="email"
                    placeholder="Your Email *"
                    class="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 bg-white border-0 rounded-lg outline-none text-gray-700 placeholder-gray-400 text-sm sm:text-base"
                  />
                  <i class="fas fa-envelope absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-sm sm:text-base" :style="{ color: themeColor }"></i>
                </div>
                
                <div class="relative">
                  <input
                    v-model="contactForm.phone"
                    type="tel"
                    placeholder="Your Phone *"
                    class="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 bg-white border-0 rounded-lg outline-none text-gray-700 placeholder-gray-400 text-sm sm:text-base"
                  />
                  <i class="fas fa-phone absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-sm sm:text-base" :style="{ color: themeColor }"></i>
                </div>
              </div>
              
              <!-- Right Column - Message -->
              <div class="relative">
                <textarea
                  v-model="contactForm.message"
                  rows="8"
                  placeholder="Your Message *"
                  class="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 bg-white border-0 rounded-lg outline-none resize-none text-gray-700 placeholder-gray-400 text-sm sm:text-base"
                ></textarea>
                <i class="fas fa-comment-dots absolute right-3 sm:right-4 top-3 sm:top-4 text-sm sm:text-base" :style="{ color: themeColor }"></i>
              </div>
            </div>
            
            <!-- Submit Button -->
            <div class="mt-6 sm:mt-8 text-center">
              <button
                @click="submitContactForm"
                :style="{ backgroundColor: themeColor }"
                class="px-8 sm:px-10 py-2.5 sm:py-3 text-white text-sm sm:text-base font-semibold rounded-lg hover:opacity-90 transition-all duration-300"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer
      class="py-6 sm:py-8 text-white"
      style="background-color: #1c1b21"
      :style="{ borderTopColor: themeColor, borderTopWidth: '2px', borderTopStyle: 'solid' }"
    >
      <div class="container mx-auto px-4 sm:px-6 md:px-8 max-w-full">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-4 sm:mb-6">
          <!-- Company Info -->
          <div class="text-center sm:text-left">
            <h3 class="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              Lilly <span :style="{ color: themeColor }">ISP</span>
            </h3>
            <p class="text-gray-400 text-xs sm:text-sm">
              Your trusted internet service provider. Connecting Indonesia with fast, reliable, and affordable internet solutions.
            </p>
          </div>
          
          <!-- Quick Links -->
          <div class="text-center sm:text-left">
            <h4 class="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h4>
            <ul class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li><a href="#id_about_us" class="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#id_services" class="text-gray-400 hover:text-white transition-colors">Services</a></li>
              <li><a href="#id_pricing" class="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#id_contact_us" class="text-gray-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <!-- Contact Info -->
          <div class="text-center sm:text-left">
            <h4 class="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact Us</h4>
            <ul class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400">
              <li class="flex items-center gap-2 justify-center sm:justify-start">
                <i class="fas fa-phone"></i>
                <span>+62 341 8222 099<br>+62 856 0712 1775</span>
              </li>
              <li class="flex items-center gap-2 justify-center sm:justify-start">
                <i class="fas fa-envelope"></i>
                <span>info@lilly.net.id</span>
              </li>
              <li class="flex items-center gap-2 justify-center sm:justify-start">
                <i class="fas fa-map-marker-alt"></i>
                <span>Jl. Pratu Herman No.34, Sedayu, Turen, Kab.Malang</span>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Social Media & Copyright -->
        <div class="border-t border-gray-700 pt-4 sm:pt-6">
          <div class="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
            <p class="text-gray-400 text-xs sm:text-sm text-center md:text-left order-2 md:order-1">
              &copy; 2025 Lilly ISP. All rights reserved.
            </p>
            <div class="flex justify-center gap-2.5 sm:gap-3 order-1 md:order-2">
              <a
                href="https://facebook.com"
                target="_blank"
                :style="{ backgroundColor: themeColor }"
                class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-all"
                title="Facebook"
              >
                <i class="fab fa-facebook-f text-sm sm:text-base"></i>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                :style="{ backgroundColor: themeColor }"
                class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-all"
                title="Instagram"
              >
                <i class="fab fa-instagram text-sm sm:text-base"></i>
              </a>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                :style="{ backgroundColor: themeColor }"
                class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-all"
                title="WhatsApp"
              >
                <i class="fab fa-whatsapp text-sm sm:text-base"></i>
              </a>
              <a
                href="mailto:support@lillyisp.id"
                :style="{ backgroundColor: themeColor }"
                class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-all"
                title="Email"
              >
                <i class="fas fa-envelope text-sm sm:text-base"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import '~/assets/css/landing.css'

// Set page title and meta
useHead({
  title: 'Lilly ISP - Fast, Reliable & Affordable Internet Service',
  meta: [
    { name: 'description', content: 'Your trusted internet service provider in Indonesia. Fast, reliable, and affordable connection for everyone.' },
    { property: 'og:title', content: 'Lilly ISP - Fast, Reliable & Affordable Internet Service' },
    { property: 'og:description', content: 'Your trusted internet service provider in Indonesia. Fast, reliable, and affordable connection for everyone.' }
  ]
})

// Theme (Red color for Lilly ISP branding)
const themeColor = ref('rgb(220, 38, 38)')
const showColorPicker = ref(false)

// Scroll state for navbar
const isScrolled = ref(false)

// Mobile menu
const mobileMenuOpen = ref(false)

// Navigation tabs
const selectedTab = ref(0)
const tabs = [
  { label: 'Portfolio', id: 'id_portfolio' },
  { label: 'About Us', id: 'id_about_us' },
  { label: 'Services', id: 'id_services' },
  { label: 'Testimonial', id: 'id_testimonial' },
  { label: 'Team', id: 'id_team' },
  { label: 'Pricing', id: 'id_pricing' },
  { label: 'News', id: 'id_news' }
]

// Hero carousel
const currentSlide = ref(0)
const slides = [
  {
    image: "/statics/images/image_1.png",
    title: "SOLUSI IT <span style='color: rgb(220, 38, 38)'>KOMPREHENSIF</span>",
    subtitle: "Kesulitan SDM bidang IT?<br>Layanan kurang lengkap?"
  },
  {
    image: "/statics/images/image_2.png",
    title: "MANAJEMEN JARINGAN<br><span style='color: rgb(220, 38, 38)'>SKALA BESAR</span>",
    subtitle: "Sulit memantau ribuan user?<br>Konfigurasi ratusan perangkat?"
  },
  {
    image: "/statics/images/image_3.png",
    title: "KONEKSI INTERNET<br><span style='color: rgb(220, 38, 38)'>HANDAL</span>",
    subtitle: "Perlu layanan internet?<br>Internet kurang handal?"
  }
]

// Services
const services = [
  { icon: 'fas fa-wifi', title: 'High-Speed Internet' },
  { icon: 'fas fa-network-wired', title: 'Dedicated Connection' },
  { icon: 'fas fa-headset', title: '24/7 Customer Support' },
  { icon: 'fas fa-shield-alt', title: 'Secure Network' }
]

// About items
const aboutItems = ref([
  { image: '/statics/images/about_1.png', title: 'IT CONSULTANT', subtitle: 'Konsultasikan kebutuhan IT dan layanan yang anda inginkan kepada kami.', hovered: false },
  { image: '/statics/images/about_2.png', title: 'PROJECT MANAGEMENT', subtitle: 'Kami berpengalaman dalam mengatur ribuan user dan perangkat jaringan.', hovered: false },
  { image: '/statics/images/about_3.png', title: 'INTERNET SERVICE', subtitle: 'Layanan internet handal dengan latensi rendah dan hop yang pendek.', hovered: false }
])

// Detailed services
const detailedServices = [
  { icon: 'fas fa-tasks', title: 'Managed Service', description: 'Layanan pengelolaan infrastruktur IT yang handal dan terukur untuk mendukung operasional bisnis Anda.' },
  { icon: 'fas fa-code', title: 'Software Developer', description: 'Pengembangan solusi perangkat lunak custom sesuai kebutuhan bisnis dengan teknologi terkini.' },
  { icon: 'fas fa-graduation-cap', title: 'Training and Certification', description: 'Program pelatihan dan sertifikasi profesional untuk meningkatkan kompetensi IT tim Anda.' },
  { icon: 'fas fa-database', title: 'Data Center and Security', description: 'Solusi data center yang aman dan terpercaya dengan standar keamanan tingkat enterprise.' },
  { icon: 'fas fa-network-wired', title: 'Hardware and Networking', description: 'Penyediaan dan instalasi perangkat keras serta infrastruktur jaringan berkualitas tinggi.' },
  { icon: 'fas fa-project-diagram', title: 'Infrastructure Engineering', description: 'Desain dan implementasi infrastruktur IT yang scalable dan reliable untuk pertumbuhan bisnis.' },
  { icon: 'fas fa-phone-volume', title: 'Telecommunication', description: 'Solusi telekomunikasi terintegrasi untuk komunikasi bisnis yang efektif dan efisien.' },
  { icon: 'fas fa-palette', title: 'Graphic Design', description: 'Layanan desain grafis profesional untuk kebutuhan branding dan marketing bisnis Anda.' },
  { icon: 'fas fa-wifi', title: 'Internet Service', description: 'Layanan internet handal dengan latensi rendah dan hop yang pendek untuk performa optimal.' }
]

// Testimonials
const currentTestimonial = ref(0)
const testimonials = [
  { name: 'Sarah Chen', role: 'Business Owner', image: '/statics/images/team_1.png' },
  { name: 'David Miller', role: 'Freelance Designer', image: '/statics/images/team_2.png' },
  { name: 'Jesicca Kim', role: 'Content Creator', image: '/statics/images/team_3.png' }
]

// Team carousel
const currentTeamSlide = ref(0)

// Pricing plans
const pricingPlans = [
  { 
    name: 'BASIC', 
    description: 'Perfect for personal use', 
    price: 150000, 
    color: '#ec982f',
    speed: '10',
    devices: '1-2',
    support: 'Email Support',
    ipType: 'Dynamic IP',
    popular: false
  },
  { 
    name: 'FAMILY', 
    description: 'Great for small families', 
    price: 250000, 
    color: '#f4655f',
    speed: '20',
    devices: '3-5',
    support: '24/7 Support',
    ipType: 'Dynamic IP',
    popular: true,
    bonus: 'Free Installation'
  },
  { 
    name: 'PREMIUM', 
    description: 'Ideal for home office', 
    price: 400000, 
    color: '#8b3bbd',
    speed: '50',
    devices: '5-8',
    support: '24/7 Priority Support',
    ipType: 'Dynamic IP',
    bonus: 'Free Router',
    popular: false
  },
  { 
    name: 'BUSINESS', 
    description: 'Best for businesses', 
    price: 750000, 
    color: '#3b97d1',
    speed: '100',
    devices: 'Unlimited',
    support: 'Dedicated Support',
    ipType: 'Static IP Included',
    bonus: 'Free Installation & Router',
    popular: false
  }
]

// News items
const newsItems = ref([
  { image: '/statics/images/about_1.png', title: 'NEW FIBER OPTIC NETWORK', hovered: false },
  { image: '/statics/images/about_2.png', title: 'SPECIAL PROMO THIS MONTH', hovered: false },
  { image: '/statics/images/about_3.png', title: 'CUSTOMER SATISFACTION AWARD', hovered: false }
])

// Portfolio items
const portfolioItems = [
  {
    image: '/statics/images/1.png',
    title: 'INTERNET SERVICE',
    subtitle: 'High-Speed Connection',
    description: 'Experience ultra-fast and stable internet connection. Perfect for streaming, gaming, and all your online activities.'
  },
  {
    image: '/statics/images/2.png',
    title: 'RELIABLE, SCALABLE & SECURE ENTERPRISE CONNECTIVITY',
    subtitle: 'Business Solutions',
    description: 'Enterprise-grade internet solutions with dedicated support and guaranteed uptime for your business needs.'
  },
  {
    image: '/statics/images/3.png',
    title: 'SEAMLESS CONNECTIVITY, FROM ENTRY ROOM TO THE BACKYARD',
    subtitle: 'Whole Home Coverage',
    description: 'Complete WiFi coverage for your entire property. Stay connected from anywhere in your home or office.'
  },
  {
    image: '/statics/images/4.png',
    title: 'SECURE, SCALABLE & ON-DEMAND ACCESS FOR YOUR INFORMATION',
    subtitle: 'Data Security',
    description: 'Advanced security features to protect your data and ensure safe browsing for you and your family.'
  },
  {
    image: '/statics/images/5.png',
    title: 'AUTOMATE & SECURE YOUR LIFE WITH INTEGRATED DEVICES',
    subtitle: 'Smart Home Ready',
    description: 'Connect all your smart devices seamlessly. Perfect for IoT and home automation systems.'
  },
  {
    image: '/statics/images/6.png',
    title: 'FIBER OPTIC NETWORK',
    subtitle: 'Future-Proof Technology',
    description: 'Lightning-fast, reliable & future-proof connectivity using the latest fiber optic technology.'
  }
]

// Contact form
const contactForm = ref({
  name: '',
  email: '',
  phone: '',
  message: ''
})

// Auto-play carousel
let carouselInterval = null
let testimonialInterval = null
let teamInterval = null

onMounted(() => {
  carouselInterval = setInterval(() => {
    nextSlide()
  }, 5000)
  
  testimonialInterval = setInterval(() => {
    currentTestimonial.value = (currentTestimonial.value + 1) % testimonials.length
  }, 5000)
  
  teamInterval = setInterval(() => {
    currentTeamSlide.value = (currentTeamSlide.value + 1) % 3
  }, 5000)
  
  // Add scroll event listener
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  if (carouselInterval) clearInterval(carouselInterval)
  if (testimonialInterval) clearInterval(testimonialInterval)
  if (teamInterval) clearInterval(teamInterval)
  window.removeEventListener('scroll', handleScroll)
})

// Functions
const navigateToSection = (id, index) => {
  selectedTab.value = index
  const element = document.getElementById(id)
  if (element) {
    const offset = element.offsetTop - 80
    window.scrollTo({
      top: offset,
      behavior: 'smooth'
    })
  }
}

const scrollToSection = (id) => {
  const element = document.getElementById(id)
  if (element) {
    const offset = element.offsetTop - 80
    window.scrollTo({
      top: offset,
      behavior: 'smooth'
    })
  }
}

const handleScroll = () => {
  // Track scroll position for navbar styling
  isScrolled.value = window.scrollY > 50
  
  const scrollPosition = window.scrollY + 100
  
  // Check which section is in viewport
  tabs.forEach((tab, index) => {
    const element = document.getElementById(tab.id)
    if (element) {
      const offsetTop = element.offsetTop
      const offsetBottom = offsetTop + element.offsetHeight
      
      if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
        selectedTab.value = index
      }
    }
  })
}

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.length
}

const prevSlide = () => {
  currentSlide.value = currentSlide.value === 0 ? slides.length - 1 : currentSlide.value - 1
}

const hoverAbout = (index) => {
  aboutItems.value[index].hovered = true
}

const unhoverAbout = (index) => {
  setTimeout(() => {
    aboutItems.value[index].hovered = false
  }, 1000)
}

const hoverNews = (index) => {
  newsItems.value[index].hovered = true
}

const unhoverNews = (index) => {
  setTimeout(() => {
    newsItems.value[index].hovered = false
  }, 1000)
}

const handleImageError = (e) => {
  // Fallback untuk gambar yang tidak ditemukan
  e.target.src = 'https://via.placeholder.com/400x300?text=Image+Placeholder'
}

const submitContactForm = () => {
  // Validate form
  if (!contactForm.value.name || !contactForm.value.email || !contactForm.value.phone || !contactForm.value.message) {
    alert('Please fill in all required fields')
    return
  }
  
  // Here you can add your form submission logic
  console.log('Form submitted:', contactForm.value)
  alert('Thank you for contacting us! We will get back to you soon.')
  
  // Reset form
  contactForm.value = {
    name: '',
    email: '',
    phone: '',
    message: ''
  }
}
</script>

<style scoped>
.landing-page {
  font-family: 'Poppins', sans-serif;
}
</style>
