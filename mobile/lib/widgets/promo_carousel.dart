import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

class PromoBanner {
  const PromoBanner({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.colors,
    this.imageUrl,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final List<Color> colors;
  final String? imageUrl;
  final VoidCallback? onTap;
}

class PromoCarousel extends StatefulWidget {
  const PromoCarousel({super.key, required this.banners});

  final List<PromoBanner> banners;

  @override
  State<PromoCarousel> createState() => _PromoCarouselState();
}

class _PromoCarouselState extends State<PromoCarousel> {
  static const _autoScrollInterval = Duration(seconds: 4);
  static const _virtualItemCount = 10000;

  late final PageController _controller;
  late int _page;
  Timer? _timer;
  bool _isUserInteracting = false;

  @override
  void initState() {
    super.initState();
    final start = _virtualItemCount ~/ 2;
    _page = widget.banners.isEmpty ? 0 : start - (start % widget.banners.length);
    _controller = PageController(initialPage: _page);
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    if (widget.banners.length > 1 && !_isUserInteracting) {
      _timer = Timer.periodic(_autoScrollInterval, (_) => _advance());
    }
  }

  void _stopTimer() {
    _timer?.cancel();
    _timer = null;
  }

  void _resetTimer() {
    _startTimer();
  }

  void _advance() {
    if (!mounted || _isUserInteracting) return;
    _controller.animateToPage(
      _page + 1,
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeInOutCubic,
    );
  }

  @override
  void dispose() {
    _stopTimer();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.banners.isEmpty) return const SizedBox.shrink();

    // A single banner has nothing to swipe to — render it as a static card instead of
    // an infinitely-swipeable PageView, which would let the user "swipe" endlessly
    // while always landing back on the same one ad.
    if (widget.banners.length == 1) {
      return SizedBox(
        height: 128,
        child: _BannerCard(banner: widget.banners.first),
      );
    }

    return Column(
      children: [
        SizedBox(
          height: 128,
          child: NotificationListener<ScrollNotification>(
            onNotification: (notification) {
              if (notification is ScrollStartNotification) {
                _isUserInteracting = true;
                _stopTimer();
              } else if (notification is ScrollEndNotification) {
                _isUserInteracting = false;
                _resetTimer();
              }
              return false;
            },
            child: PageView.builder(
              controller: _controller,
              itemCount: _virtualItemCount,
              onPageChanged: (i) {
                setState(() => _page = i);
                if (!_isUserInteracting) _resetTimer();
              },
              itemBuilder: (context, index) {
                final banner = widget.banners[index % widget.banners.length];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: _BannerCard(banner: banner),
                );
              },
            ),
          ),
        ),
        if (widget.banners.length > 1) ...[
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(widget.banners.length, (i) {
              final active = i == _page % widget.banners.length;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: active ? 18 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: active
                      ? widget.banners[i].colors.last
                      : widget.banners[i].colors.last.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }),
          ),
        ],
      ],
    );
  }
}

class _BannerCard extends StatelessWidget {
  const _BannerCard({required this.banner});

  final PromoBanner banner;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: banner.onTap,
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: banner.colors,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(color: banner.colors.last.withValues(alpha: 0.28), blurRadius: 14, offset: const Offset(0, 8)),
            ],
          ),
          child: Stack(
            children: [
              if (banner.imageUrl != null && banner.imageUrl!.isNotEmpty)
                Positioned.fill(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: CachedNetworkImage(
                      imageUrl: banner.imageUrl!,
                      fit: BoxFit.cover,
                      color: Colors.black.withValues(alpha: 0.35),
                      colorBlendMode: BlendMode.darken,
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            banner.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Colors.white, fontSize: 16.5, fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            banner.subtitle,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(color: Colors.white.withValues(alpha: 0.92), fontSize: 12.5, height: 1.3),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), shape: BoxShape.circle),
                      child: Icon(banner.icon, color: Colors.white, size: 26),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
