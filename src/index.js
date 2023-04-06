import './css/styles.css';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import Notiflix from 'notiflix';

import PicturesAPIService from './pictures-service/pictures_service_api';

let lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});

const refs = {
  searchForm: document.querySelector('.search-form'),
  picturesContainer: document.querySelector('.gallery'),
  loadMoreBtn: document.querySelector('.load-more'),
};

const picturesAPIService = new PicturesAPIService();

refs.searchForm.addEventListener('submit', onSearch);
refs.loadMoreBtn.addEventListener('click', onLoadMore);

const observer = new IntersectionObserver(function ([entry], observer) {
  if (entry.isIntersecting) {
    observer.unobserve(entry.target);
    onLoadMore();
  }
}, {});

function onSearch(e) {
  e.preventDefault();
  clearPicturesContainer();
  const inputValue = e.currentTarget.elements.searchQuery.value;
  picturesAPIService.query = inputValue.trim();
  if (!picturesAPIService.query) {
    Notiflix.Notify.info('Please, type something!');
    return;
  }
  picturesAPIService.resetPage();
  refs.loadMoreBtn.classList.add('ishidden');

  const fetchCards = async () => {
    try {
      const response = await picturesAPIService.fetchPictures();

      const data = await response;

      if (data.hits.length === 0) {
        Notiflix.Notify.info(
          'Sorry, there are no images matching your search query. Please try again.'
        );
        return;
      }
      clearPicturesContainer();
      const markUp = createPicturesMarkup(data.hits);
      appendPicturesCardMarcup(markUp);
      lightbox.refresh();
      if (data.hits.length > 0) {
        Notiflix.Notify.info(`Hooray! We found ${data.totalHits} images.`);
        refs.loadMoreBtn.classList.add('ishidden');
      }

      refs.loadMoreBtn.classList.remove('ishidden');
    } catch (error) {
      console.log(error.message);
    }
  };

  fetchCards();
}

function onLoadMore(e) {
  const fetchCards = async () => {
    try {
      const response = await picturesAPIService.fetchPictures();
      const data = await response;
      if (data.hits.length === 0) {
        return;
      }
      const markUp = createPicturesMarkup(data.hits);
      appendPicturesCardMarcup(markUp);
      lightbox.refresh();
      if (picturesAPIService.page - 1 >= data.totalHits / 40) {
        Notiflix.Notify.info(
          "We're sorry, but you've reached the end of search results."
        );
        refs.loadMoreBtn.classList.add('ishidden');
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  fetchCards();
}

function appendPicturesCardMarcup(markUp) {
  refs.picturesContainer.insertAdjacentHTML('beforeend', markUp);
  const lastEl = refs.picturesContainer.lastElementChild;
  if (lastEl) {
    observer.observe(lastEl);
  }
}

function createPicturesMarkup(pictures) {
  return pictures
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `<a href="${largeImageURL}"><div class="photo-card">
  <img src="${webformatURL}" alt="${tags}" loading="lazy" class="img-card" />
  <div class="info">
    <p class="info-item">
      <b>Likes</b>${likes}
    </p>
    <p class="info-item">
      <b>Views</b>${views}
    </p>
    <p class="info-item">
      <b>Comments</b>${comments}
    </p>
    <p class="info-item">
      <b>Downloads</b>${downloads}
    </p>
  </div>
</div></a>`;
      }
    )
    .join('');
}

function clearPicturesContainer() {
  refs.picturesContainer.innerHTML = '';
}
