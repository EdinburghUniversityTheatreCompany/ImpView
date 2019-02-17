FROM ruby:2.5
WORKDIR /srv/impamp
ADD Gemfile* /srv/impamp/
RUN bundle install
ADD . /srv/impamp/
RUN bundle exec middleman build --verbose

FROM nginx:latest
WORKDIR /usr/share/nginx/html
COPY --from=0 /srv/impamp/build/. .