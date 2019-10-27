Rails.application.routes.draw do
  devise_for :users
  root 'mousike#index'
end
