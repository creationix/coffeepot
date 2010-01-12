
# Assignment:
number: 42
opposite_day: true

# Conditions:
number: -42 if opposite_day

# Functions:
square: x => x * x

# Arrays:
list: [1, 2, 3, 4, 5]

# Objects:
math: {
  root:   Math.sqrt
  square: square
  cube:   x => x * square(x)
}

# Splats:
race: winner, runners... =>
  print(winner, runners)

# Existence:
alert("I knew it!") if elvis?

# Array comprehensions:
cubed_list: math.cube(num) for num in list

square: x => x * x
cube:   x => square(x) * x

greeting: "Hello CoffeeScript"
difficulty: 0.5

song: ["do", "re", "mi", "fa", "so"]

ages: {
  max: 10
  ida: 9
  tim: 11
}

matrix: [
  1, 0, 1
  0, 0, 1
  1, 1, 0
]

num: 1
change_numbers: =>
  new_num: -1
  num: 10
new_num: change_numbers()

mood: greatly_improved if singing

if happy and knows_it
  claps_hands()
  cha_cha_cha()

date: if friday then sue else jill

expensive ||= do_the_math()

solipsism: true if mind? and not world?

launch() if ignition is on

volume: 10 if band isnt spinal_tap

let_the_wild_rumpus_begin() unless answer is no

if car.speed < speed_limit then accelerate()

gold: silver: the_field: "unknown"

medalists: first, second, rest... =>
  gold:       first
  silver:     second
  the_field:  rest

contenders: [
  "Michael Phelps"
  "Liu Xiang"
  "Yao Ming"
  "Allyson Felix"
  "Shawn Johnson"
  "Roman Sebrle"
  "Guo Jingjing"
  "Tyson Gay"
  "Asafa Powell"
  "Usain Bolt"
]

medalists(contenders...)

alert("Gold: " + gold)
alert("Silver: " + silver)
alert("The Field: " + the_field)

backwards: =>
  alert(arguments.reverse())

backwards("stairway", "to", "heaven")

while demand > supply
  sell()
  restock()

while supply > demand then buy()

# Eat lunch.
lunch: eat(food) for food in ['toast', 'cheese', 'wine']

# Naive collision detection.
for roid in asteroids
  for roid2 in asteroids when roid isnt roid2
    roid.explode() if roid.overlaps(roid2)

countdown: num for num in [10..1]

egg_delivery: =>
  for i in [0...eggs.length] by 12
    dozen_eggs: eggs[i...i+12]
    deliver(new egg_carton(dozen))

years_old: {max: 10, ida: 9, tim: 11}

ages: for child, age of years_old
  child + " is " + age

numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

three_to_six: numbers[3..6]

numbers_copy: numbers[0...numbers.length]

numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

numbers[3..6]: [-3, -4, -5, -6]

grade: student =>
  if student.excellent_work
    "A+"
  else if student.okay_stuff
    if student.tried_hard then "B" else "B-"
  else
    "C"

eldest: if 24 > 21 then "Liz" else "Ike"

six: (one: 1) + (two: 2) + (three: 3)

# The first ten global properties.

globals: (name for name of window)[0...10]

alert(
  try
    nonexistent / undefined
  catch error
    "Caught an error: " + error
)

Animal: =>
Animal::move: meters =>
  alert(this.name + " moved " + meters + "m.")

Snake: name => this.name: name
Snake extends Animal
Snake::move: =>
  alert("Slithering...")
  super(5)

Horse: name => this.name: name
Horse extends Animal
Horse::move: =>
  alert("Galloping...")
  super(45)

sam: new Snake("Sammy the Python")
tom: new Horse("Tommy the Palomino")

sam.move()
tom.move()

$('table.list').each() table =>
  $('tr.account', table).each() row =>
    row.show()
    row.highlight()

bait: 1000
and_switch: 0

[bait, and_switch]: [and_switch, bait]

weather_report: location =>
  # Make an Ajax request to fetch the weather...
  [location, 72, "Mostly Sunny"]

[city, temp, forecast]: weather_report("Berkeley, CA")

futurists: {
  sculptor: "Umberto Boccioni"
  painter:  "Vladimir Burliuk"
  poet: {
    name:   "F.T. Marinetti"
    address: [
      "Via Roma 42R"
      "Bellagio, Italy 22021"
    ]
  }
}

{poet: {name: poet, address: [street, city]}}: futurists

hi: `function() {
  return [document.title, "Hello JavaScript"].join(": ");
}`

switch day
  when "Tuesday"   then eat_breakfast()
  when "Wednesday" then go_to_the_park()
  when "Saturday"
    if day is bingo_day
      go_to_bingo()
      go_dancing()
  when "Sunday"    then go_to_church()
  else go_to_work()

try
  all_hell_breaks_loose()
  cats_and_dogs_living_together()
catch error
  print(error)
finally
  clean_up()

moby_dick: "Call me Ishmael. Some years ago --
never mind how long precisely -- having little
or no money in my purse, and nothing particular
to interest me on shore, I thought I would sail
about a little and see the watery part of the
world..."

html: '''
      <strong>
        cup of coffeescript
      </strong>
      '''


