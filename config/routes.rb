Rails.application.routes.draw do
  devise_for :users
  resources :mousike_constoller
  root 'mousike#index'
end
