// JavaScript Document

(function () {
	setTimeout(init, 0);

	function init() {

		if (!navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/)) {
			//ここに書いた処理はスマホ閲覧時は無効となる

			//************************ reveal on load ********************************

			var rev1 = new RevealFx(document.querySelector('#rev-1'), {
				revealSettings: {
					duration: 700,
					bgcolor: '#EEE',
					onCover: function (contentEl, revealerEl) {
						contentEl.style.opacity = 1;
						anime({
							targets: contentEl,
							duration: 0,
							delay: 0,
							easing: 'easeOutExpo',
							opacity: [0, 1]
						});
					}
				}
			});
			rev1.reveal();

			var rev11 = new RevealFx(document.querySelector('#rev-11'), {
				revealSettings: {
					duration: 700,
					delay: 1000,
					bgcolor: '#151f45',
					onCover: function (contentEl, revealerEl) {
						contentEl.style.opacity = 1;
						anime({
							targets: contentEl,
							duration: 0,
							delay: 0,
							easing: 'easeOutExpo',
							opacity: [0, 1]
						});
					}
				}
			});
			rev11.reveal();

			var rev2 = new RevealFx(document.querySelector('#rev-2'), {
				revealSettings: {
					duration: 700,
					delay: 1000,
					direction: 'tb',
					bgcolor: '#151f45',
					onCover: function (contentEl, revealerEl) {
						contentEl.style.opacity = 1;
						anime({
							targets: contentEl,
							duration: 0,
							delay: 0,
							easing: 'easeOutExpo',
							opacity: [0, 1]
						});
					}
				}
			});
			rev2.reveal();

			var rev3 = new RevealFx(document.querySelector('#rev-3'), {
				revealSettings: {
					bgcolor: '#151f45',
					delay: 1000,
					duration: 700,
					direction: 'tb',
					onCover: function (contentEl, revealerEl) {
						contentEl.style.opacity = 1;
					}
				}
			});
			rev3.reveal();

			var rev4 = new RevealFx(document.querySelector('#rev-4'), {
				revealSettings: {
					bgcolor: '#151f45',
					delay: 1000,
					duration: 700,
					direction: 'tb',
					onCover: function (contentEl, revealerEl) {
						contentEl.style.opacity = 1;
					}
				}
			});
			rev4.reveal();

			var rev5 = new RevealFx(document.querySelector('#rev-5'), {
				revealSettings: {
					bgcolor: '#151f45',
					delay: 1000,
					duration: 700,
					direction: 'tb',
					onCover: function (contentEl, revealerEl) {
						contentEl.style.opacity = 1;
					}
				}
			});
			rev5.reveal();

			var rev6 = new RevealFx(document.querySelector('#rev-6'), {
				revealSettings: {
					bgcolor: '#151f45',
					delay: 1000,
					duration: 700,
					direction: 'tb',
					onCover: function (contentEl, revealerEl) {
						contentEl.style.opacity = 1;
					}
				}
			});
			rev6.reveal();

			var rev7 = new RevealFx(document.querySelector('#rev-7'), {
				revealSettings: {
					bgcolor: '#151f45',
					delay: 1000,
					duration: 700,
					onCover: function (contentEl, revealerEl) {
						contentEl.style.opacity = 1;
					}
				}
			});
			rev7.reveal();




			//************************ reveal on scroll ********************************

			setTimeout(rev20, 10);

			function rev20() {
				var scrollElemToWatch_20 = document.getElementById('rev-20'),
					watcher_20 = scrollMonitor.create(scrollElemToWatch_20, -100),
					rev20 = new RevealFx(scrollElemToWatch_20, {
						revealSettings: {
							bgcolor: '#EEE',
							duration: 700,
							onCover: function (contentEl, revealerEl) {
								contentEl.style.opacity = 1;
							}
						}
					})
				watcher_20.enterViewport(function () {
					rev20.reveal();
					watcher_20.destroy();
				});
			}

			setTimeout(rev23, 10);

			function rev23() {
				var scrollElemToWatch_23 = document.getElementById('rev-23'),
					watcher_23 = scrollMonitor.create(scrollElemToWatch_23, -100),
					rev23 = new RevealFx(scrollElemToWatch_23, {
						revealSettings: {
							bgcolor: '#9A0000',
							duration: 700,
							delay: 700,
							onStart: function (contentEl, revealerEl) {
								anime.remove(contentEl);
								contentEl.style.opacity = 0;
							},
							onCover: function (contentEl, revealerEl) {
								contentEl.style.opacity = 1;
								anime({
									targets: contentEl,
									duration: 1000,
									delay: 0,
									easing: 'easeOutExpo',
									translateX: [-100, 0],
									opacity: [0, 1]
								});
							}
						}
					})
				watcher_23.enterViewport(function () {
					rev23.reveal();
					watcher_23.destroy();
				});
			}

			setTimeout(rev21, 10);

			function rev21() {
				var scrollElemToWatch_21 = document.getElementById('rev-21'),
					watcher_21 = scrollMonitor.create(scrollElemToWatch_21, -100),
					rev21 = new RevealFx(scrollElemToWatch_21, {
						revealSettings: {
							bgcolor: '#eee',
							duration: 700,
							delay: 700,
							onStart: function (contentEl, revealerEl) {
								anime.remove(contentEl);
								contentEl.style.opacity = 0;
							},
							onCover: function (contentEl, revealerEl) {
								contentEl.style.opacity = 1;
								anime({
									targets: contentEl,
									duration: 700,
									delay: 0,
									easing: 'easeOutExpo',
									translateX: [-100, 0],
									opacity: [0, 1]
								});
							}
						}
					})
				watcher_21.enterViewport(function () {
					rev21.reveal();
					watcher_21.destroy();
				});
			}

			setTimeout(rev22, 10);

			function rev22() {
				var scrollElemToWatch_22 = document.getElementById('rev-22'),
					watcher_22 = scrollMonitor.create(scrollElemToWatch_22, -100),
					rev22 = new RevealFx(scrollElemToWatch_22, {
						revealSettings: {
							bgcolor: '#151f45',
							duration: 700,
							delay: 700,
							onStart: function (contentEl, revealerEl) {
								anime.remove(contentEl);
								contentEl.style.opacity = 0;
							},
							onCover: function (contentEl, revealerEl) {
								contentEl.style.opacity = 1;
								anime({
									targets: contentEl,
									duration: 700,
									delay: 400,
									easing: 'easeOutExpo',
									translateX: [-100, 0],
									opacity: [0, 1]
								});
							}
						}
					})
				watcher_22.enterViewport(function () {
					rev22.reveal();
					watcher_22.destroy();
				});
			}

			setTimeout(rev24, 10);

			function rev24() {
				var scrollElemToWatch_24 = document.getElementById('rev-24'),
					watcher_24 = scrollMonitor.create(scrollElemToWatch_24, -100),
					rev24 = new RevealFx(scrollElemToWatch_24, {
						revealSettings: {
							bgcolor: '#151f45',
							duration: 1200,
							delay: 0,
							onStart: function (contentEl, revealerEl) {
								anime.remove(contentEl);
								contentEl.style.opacity = 0;
							},
							onCover: function (contentEl, revealerEl) {
								contentEl.style.opacity = 1;
								anime({
									targets: contentEl,
									duration: 700,
									delay: 400,
									easing: 'easeOutExpo',
									translateX: [-80, 0],
									opacity: [0, 1]
								});
							}
						}
					})
				watcher_24.enterViewport(function () {
					rev24.reveal();
					watcher_24.destroy();
				});
			}

			setTimeout(rev25, 10);

			function rev25() {
				var scrollElemToWatch_25 = document.getElementById('rev-25'),
					watcher_25 = scrollMonitor.create(scrollElemToWatch_25, -100),
					rev25 = new RevealFx(scrollElemToWatch_25, {
						revealSettings: {
							bgcolor: '#151f45',
							duration: 1200,
							delay: 300,
							onStart: function (contentEl, revealerEl) {
								anime.remove(contentEl);
								contentEl.style.opacity = 0;
							},
							onCover: function (contentEl, revealerEl) {
								contentEl.style.opacity = 1;
								anime({
									targets: contentEl,
									duration: 700,
									delay: 400,
									easing: 'easeOutExpo',
									translateX: [-80, 0],
									opacity: [0, 1]
								});
							}
						}
					})
				watcher_25.enterViewport(function () {
					rev25.reveal();
					watcher_25.destroy();
				});
			}

			setTimeout(rev26, 10);

			function rev26() {
				var scrollElemToWatch_26 = document.getElementById('rev-26'),
					watcher_26 = scrollMonitor.create(scrollElemToWatch_26, -100),
					rev26 = new RevealFx(scrollElemToWatch_26, {
						revealSettings: {
							bgcolor: '#151f45',
							duration: 1200,
							delay: 600,
							onStart: function (contentEl, revealerEl) {
								anime.remove(contentEl);
								contentEl.style.opacity = 0;
							},
							onCover: function (contentEl, revealerEl) {
								contentEl.style.opacity = 1;
								anime({
									targets: contentEl,
									duration: 700,
									delay: 400,
									easing: 'easeOutExpo',
									translateX: [-80, 0],
									opacity: [0, 1]
								});
							}
						}
					})
				watcher_26.enterViewport(function () {
					rev26.reveal();
					watcher_26.destroy();
				});
			}

			setTimeout(rev27, 10);

			function rev27() {
				var scrollElemToWatch_27 = document.getElementById('rev-27'),
					watcher_27 = scrollMonitor.create(scrollElemToWatch_27, -100),
					rev27 = new RevealFx(scrollElemToWatch_27, {
						revealSettings: {
							bgcolor: '#9A0000',
							duration: 1200,
							delay: 1000,
							onStart: function (contentEl, revealerEl) {
								anime.remove(contentEl);
								contentEl.style.opacity = 0;
							},
							onCover: function (contentEl, revealerEl) {
								contentEl.style.opacity = 1;
								anime({
									targets: contentEl,
									duration: 700,
									delay: 400,
									easing: 'easeOutExpo',
									translateX: [-80, 0],
									opacity: [0, 1]
								});
							}
						}
					})
				watcher_27.enterViewport(function () {
					rev27.reveal();
					watcher_27.destroy();
				});
			}

			setTimeout(rev28, 10);

			function rev28() {
				var scrollElemToWatch_28 = document.getElementById('rev-28'),
					watcher_28 = scrollMonitor.create(scrollElemToWatch_28, -100),
					rev28 = new RevealFx(scrollElemToWatch_28, {
						revealSettings: {
							bgcolor: '#151f45',
							duration: 700,
							direction: 'rl',
							delay: 500,
							onStart: function (contentEl, revealerEl) {
								anime.remove(contentEl);
								contentEl.style.opacity = 0;
							},
							onCover: function (contentEl, revealerEl) {
								contentEl.style.opacity = 1;
								anime({
									targets: contentEl,
									duration: 700,
									delay: 400,
									easing: 'easeOutExpo',
									translateX: [100, 0],
									opacity: [0, 1]
								});
							}
						}
					})
				watcher_28.enterViewport(function () {
					rev28.reveal();
					watcher_28.destroy();
				});
			}
			
			
			
			
			setTimeout(rev29, 10);

			function rev29() {
				var scrollElemToWatch_29 = document.getElementById('rev-29'),
					watcher_29 = scrollMonitor.create(scrollElemToWatch_29, -100),
					rev29 = new RevealFx(scrollElemToWatch_29, {
						revealSettings: {
							bgcolor: '#151f45',
							duration: 700,
							direction: 'rl',
							delay: 0,
							opacity: [0],
							onStart: function (contentEl, revealerEl) {
								anime.remove(contentEl);
								contentEl.style.opacity = 0;
							},
							onCover: function (contentEl, revealerEl) {
								contentEl.style.opacity = 1;
								anime({
									targets: contentEl,
									duration: 700,
									delay: 300,
									easing: 'easeOutExpo',
									translateX: [100, 0],
									opacity: [0, 1]
								});
							}
						}
					})
				watcher_29.enterViewport(function () {
					rev29.reveal();
					watcher_29.destroy();
				});
			}
			
			
			setTimeout(rev30, 10);

			function rev30() {
				var scrollElemToWatch_30 = document.getElementById('rev-30'),
					watcher_30 = scrollMonitor.create(scrollElemToWatch_30, -100),
					rev30 = new RevealFx(scrollElemToWatch_30, {
						revealSettings: {
							bgcolor: '#151f45',
							duration: 700,
							direction: 'rl',
							delay:0,
							onStart: function (contentEl, revealerEl) {
								anime.remove(contentEl);
								contentEl.style.opacity = 0;
							},
							onCover: function (contentEl, revealerEl) {
								contentEl.style.opacity = 1;
								anime({
									targets: contentEl,
									duration: 700,
									delay: 300,
									easing: 'easeOutExpo',
									opacity: [0, 1]
								});
							}
						}
					})
				watcher_30.enterViewport(function () {
					rev30.reveal();
					watcher_30.destroy();
				});
			}
			
			
			setTimeout(rev31, 10);

			function rev31() {
				var scrollElemToWatch_31 = document.getElementById('rev-31'),
					watcher_31 = scrollMonitor.create(scrollElemToWatch_31, -100),
					rev31 = new RevealFx(scrollElemToWatch_31, {
						revealSettings: {
							bgcolor: '#151f45',
							duration: 700,
							delay: 0,
							opacity: [0],
							onStart: function (contentEl, revealerEl) {
								anime.remove(contentEl);
								contentEl.style.opacity = 0;
							},
							onCover: function (contentEl, revealerEl) {
								contentEl.style.opacity = 1;
								anime({
									targets: contentEl,
									duration: 700,
									delay: 300,
									easing: 'easeOutExpo',
									translateX: [-100, 0],
									opacity: [0, 1]
								});
							}
						}
					})
				watcher_31.enterViewport(function () {
					rev31.reveal();
					watcher_31.destroy();
				});
			}
			
			
			
			
			setTimeout(rev32, 10);

			function rev32() {
				var scrollElemToWatch_32 = document.getElementById('rev-32'),
					watcher_32 = scrollMonitor.create(scrollElemToWatch_32, -100),
					rev32 = new RevealFx(scrollElemToWatch_32, {
						revealSettings: {
							bgcolor: '#151f45',
							duration: 700,
							delay:0,
							onStart: function (contentEl, revealerEl) {
								anime.remove(contentEl);
								contentEl.style.opacity = 0;
							},
							onCover: function (contentEl, revealerEl) {
								contentEl.style.opacity = 1;
								anime({
									targets: contentEl,
									duration: 700,
									delay: 320,
									easing: 'easeOutExpo',
									opacity: [0, 1]
								});
							}
						}
					})
				watcher_32.enterViewport(function () {
					rev32.reveal();
					watcher_32.destroy();
				});
			}



setTimeout(rev33, 10);

			function rev33() {
				var scrollElemToWatch_33 = document.getElementById('rev-33'),
					watcher_33 = scrollMonitor.create(scrollElemToWatch_33, -100),
					rev33 = new RevealFx(scrollElemToWatch_33, {
						revealSettings: {
							bgcolor: '#151f45',
							duration: 700,
							direction: 'rl',
							delay: 0,
							opacity: [0],
							onStart: function (contentEl, revealerEl) {
								anime.remove(contentEl);
								contentEl.style.opacity = 0;
							},
							onCover: function (contentEl, revealerEl) {
								contentEl.style.opacity = 1;
								anime({
									targets: contentEl,
									duration: 700,
									delay: 300,
									easing: 'easeOutExpo',
									translateX: [100, 0],
									opacity: [0, 1]
								});
							}
						}
					})
				watcher_33.enterViewport(function () {
					rev33.reveal();
					watcher_33.destroy();
				});
			}
			
			
			
			setTimeout(rev34, 10);

			function rev34() {
				var scrollElemToWatch_34 = document.getElementById('rev-34'),
					watcher_34 = scrollMonitor.create(scrollElemToWatch_34, -100),
					rev34 = new RevealFx(scrollElemToWatch_34, {
						revealSettings: {
							bgcolor: '#151f45',
							duration: 700,
							delay:0,
							direction: 'rl',
							onStart: function (contentEl, revealerEl) {
								anime.remove(contentEl);
								contentEl.style.opacity = 0;
							},
							onCover: function (contentEl, revealerEl) {
								contentEl.style.opacity = 1;
								anime({
									targets: contentEl,
									duration: 700,
									delay: 340,
									easing: 'easeOutExpo',
									opacity: [0, 1]
								});
							}
						}
					})
				watcher_34.enterViewport(function () {
					rev34.reveal();
					watcher_34.destroy();
				});
			}
			
			
			

			var revSample = new RevealFx(document.querySelector('#rev-Sample'), {
				revealSettings: {
					bgcolor: '#151f45',
					delay: 700,
					duration: 700,
					direction: 'tb',
					onCover: function (contentEl, revealerEl) {
						contentEl.style.opacity = 1;
					}
				}
			});
			revSample.reveal();


		}

	}
})();
